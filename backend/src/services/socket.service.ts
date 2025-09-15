import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
}

class SocketService {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
        this.setupSocketHandlers();
    }

    private setupSocketHandlers() {
        this.io.use(this.authenticateSocket.bind(this));
        
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`🔌 User connected: ${socket.userEmail} (${socket.id})`);
            
            // Join user to their personal room for direct messaging
            if (socket.userId) {
                socket.join(`user:${socket.userId}`);
                console.log(`👤 User ${socket.userEmail} joined room: user:${socket.userId}`);
            }

            // Handle chat events
            socket.on('join_chat', (data) => this.handleJoinChat(socket, data));
            socket.on('send_message', (data) => this.handleSendMessage(socket, data));
            socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
            socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
            
            // Handle streaming chat events
            socket.on('start_chat_with_streaming', (data) => this.handleStartChatWithStreaming(socket, data));
            socket.on('send_streaming_message', (data) => this.handleSendStreamingMessage(socket, data));
            
            socket.on('disconnect', () => {
                console.log(`❌ User disconnected: ${socket.userEmail} (${socket.id})`);
            });
        });
    }

    // Authenticate socket connection using JWT
    private async authenticateSocket(socket: AuthenticatedSocket, next: Function) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as any;
            const user = await User.findById(decoded._id);
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = (user._id as any).toString();
            socket.userEmail = user.email;
            next();
        } catch (error) {
            console.log('❌ Socket authentication failed:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    }

    // Handle joining a chat session
    private handleJoinChat(socket: AuthenticatedSocket, data: { chatId: string }) {
        const { chatId } = data;
        socket.join(`chat:${chatId}`);
        console.log(`💬 User ${socket.userEmail} joined chat: ${chatId}`);
        
        // Notify others in the chat
        socket.to(`chat:${chatId}`).emit('user_joined', {
            userId: socket.userId,
            userEmail: socket.userEmail,
            timestamp: new Date()
        });
    }

    // Handle sending a message
    private async handleSendMessage(socket: AuthenticatedSocket, data: { chatId: string, message: string }) {
        const { chatId, message } = data;
        
        console.log(`📤 Message from ${socket.userEmail} in chat ${chatId}: ${message}`);
        
        // Emit typing indicator for AI response
        this.io.to(`chat:${chatId}`).emit('ai_typing_start', {
            chatId,
            timestamp: new Date()
        });

        // Here we'll trigger the AI response (we'll implement this next)
        // For now, just acknowledge the message
        socket.emit('message_received', {
            chatId,
            messageId: Date.now().toString(),
            timestamp: new Date()
        });
    }

    // Handle typing indicators
    private handleTypingStart(socket: AuthenticatedSocket, data: { chatId: string }) {
        socket.to(`chat:${data.chatId}`).emit('user_typing_start', {
            userId: socket.userId,
            userEmail: socket.userEmail,
            chatId: data.chatId,
            timestamp: new Date()
        });
    }

    private handleTypingStop(socket: AuthenticatedSocket, data: { chatId: string }) {
        socket.to(`chat:${data.chatId}`).emit('user_typing_stop', {
            userId: socket.userId,
            userEmail: socket.userEmail,
            chatId: data.chatId,
            timestamp: new Date()
        });
    }

    // Emit AI response in chunks (streaming)
    public emitAIResponseChunk(chatId: string, chunk: string, isComplete: boolean = false) {
        this.io.to(`chat:${chatId}`).emit('ai_response_chunk', {
            chatId,
            chunk,
            isComplete,
            timestamp: new Date()
        });
    }

    // Stop AI typing indicator
    public stopAITyping(chatId: string) {
        this.io.to(`chat:${chatId}`).emit('ai_typing_stop', {
            chatId,
            timestamp: new Date()
        });
    }

    // Send complete AI response
    public emitAIResponse(chatId: string, response: string, messageId: string) {
        this.io.to(`chat:${chatId}`).emit('ai_response_complete', {
            chatId,
            response,
            messageId,
            timestamp: new Date()
        });
    }

    // Notify user in their personal room
    public notifyUser(userId: string, event: string, data: any) {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    // Handle starting a new chat with streaming
    private async handleStartChatWithStreaming(socket: AuthenticatedSocket, data: { message: string }) {
        const { message } = data;
        console.log(`🚀 Starting streaming chat for ${socket.userEmail}: ${message}`);
        
        try {
            // Import chat controller functions
            const { startChatWithStreamingMessage } = await import('../controllers/chat.controller.js');
            
            // Create a mock request/response for the controller
            const mockReq = {
                body: { message },
                user: { _id: socket.userId }
            } as any;
            
            const mockRes = {
                status: (code: number) => ({
                    json: (data: any) => {
                        socket.emit('chat_started', data);
                    }
                })
            } as any;
            
            const mockNext = (error?: any) => {
                if (error) {
                    console.error('❌ Controller error:', error);
                    socket.emit('error', { message: error.message || 'Failed to start chat' });
                }
            };
            
            // Call the controller function
            await startChatWithStreamingMessage(mockReq, mockRes, mockNext);
            
        } catch (error) {
            console.error('❌ Error starting streaming chat:', error);
            socket.emit('error', { message: 'Failed to start chat' });
        }
    }

    // Handle sending a message with streaming
    private async handleSendStreamingMessage(socket: AuthenticatedSocket, data: { chatId: string, message: string }) {
        const { chatId, message } = data;
        console.log(`📤 Streaming message from ${socket.userEmail} in chat ${chatId}: ${message}`);
        
        try {
            // Import chat controller functions
            const { sendStreamingMessage } = await import('../controllers/chat.controller.js');
            
            // Create a mock request/response for the controller
            const mockReq = {
                body: { chatId, message },
                user: { _id: socket.userId }
            } as any;
            
            const mockRes = {
                status: (code: number) => ({
                    json: (data: any) => {
                        socket.emit('message_sent', data);
                    }
                })
            } as any;
            
            const mockNext = (error?: any) => {
                if (error) {
                    console.error('❌ Controller error:', error);
                    socket.emit('error', { message: error.message || 'Failed to send message' });
                }
            };
            
            // Call the controller function
            await sendStreamingMessage(mockReq, mockRes, mockNext);
            
        } catch (error) {
            console.error('❌ Error sending streaming message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    }
}

export default SocketService;