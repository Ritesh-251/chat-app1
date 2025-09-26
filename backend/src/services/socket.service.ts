import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { getDbConnection } from "../db/index.js";
import { userSchema } from "../models/user.model.js";

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
                console.log('❌ Socket auth failed: no token provided in handshake.auth or Authorization header');
                return next(new Error('Authentication error: No token provided'));
            }

            // Try to decode token without verification first to get appId (so we can select the right DB)
            const unverified = jwt.decode(token) as any || {};
            const tokenAppId = unverified?.appId;

            // Determine appId: prefer appId embedded in token, then handshake headers/query, then default
            const handshakeAppId = socket.handshake.auth?.appId || socket.handshake.headers['x-app-id'] || socket.handshake.query.appId;
            const appId = tokenAppId || handshakeAppId || 'app1';
            const authSource = tokenAppId ? 'token.payload' : (socket.handshake.auth?.appId ? 'auth.payload' : (socket.handshake.headers['x-app-id'] ? 'headers' : (socket.handshake.query.appId ? 'query' : 'default')));
            (socket as any).appId = appId;

            // Mask token for logs
            const maskedToken = typeof token === 'string' ? `${token.substring(0, Math.min(12, token.length))}...(${token.length} chars)` : 'non-string-token';
            console.log(`🔐 Socket auth attempt - chosen appId: ${appId} (source: ${authSource}), token: ${maskedToken}`);

            // Use the app-specific DB connection and model to look up the user
            const connection = getDbConnection(appId as string);
            const UserModel = connection.model('User', userSchema);

            // Now verify the token with the secret
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as any;
            console.log(`🔎 Token verified - _id: ${decoded?._id}, appId: ${decoded?.appId}`);

            const user = await UserModel.findById(decoded._id);

            if (!user) {
                console.log(`❌ User not found in DB for appId=${appId}. Decoded id=${decoded?._id}. DB: ${connection.host}:${connection.port}/${connection.name}`);
                return next(new Error(`Authentication error: User not found for appId=${appId}`));
            }

            socket.userId = (user._id as any).toString();
            socket.userEmail = user.email;

            console.log(`🔌 Socket authenticated for app: ${appId} (appId source: ${authSource}) - user: ${socket.userEmail} (${socket.userId})`);
            next();
        } catch (error) {
            console.log('❌ Socket authentication failed:', (error as any)?.message || error);
            // Propagate the underlying error message where safe (helps debugging)
            return next(new Error(`Authentication error: ${((error as any)?.message) || 'Invalid token'}`));
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

    // Emit AI response with cumulative content (better for UI consistency)
    public emitAIResponseCumulative(chatId: string, fullContent: string, isComplete: boolean = false) {
        this.io.to(`chat:${chatId}`).emit('ai_response_cumulative', {
            chatId,
            content: fullContent,
            isComplete,
            timestamp: new Date()
        });
    }

    // Emit AI response completion event
    public emitAIResponseComplete(chatId: string, finalContent: string) {
        this.io.to(`chat:${chatId}`).emit('ai_response_complete', {
            chatId,
            content: finalContent,
            timestamp: new Date()
        });
    }

    // Emit AI response update with word-safe chunking
    public emitAIResponseWordSafe(chatId: string, newWords: string, fullContent: string, isComplete: boolean = false) {
        this.io.to(`chat:${chatId}`).emit('ai_response_word_safe', {
            chatId,
            newWords,
            fullContent,
            isComplete,
            timestamp: new Date()
        });
    }

    // Emit AI typing start indicator (professional)
    public startAITyping(chatId: string) {
        this.io.to(`chat:${chatId}`).emit('ai_typing_start', {
            chatId,
            isTyping: true,
            timestamp: new Date()
        });
    }

    // Stop AI typing indicator
    public stopAITyping(chatId: string) {
        this.io.to(`chat:${chatId}`).emit('ai_typing_stop', {
            chatId,
            isTyping: false,
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
            // Import chat controller functions and database utilities
            const { startChatWithStreamingMessage } = await import('../controllers/chat.controller.js');
            const { getDbConnection } = await import('../db/index.js');
            const { chatSchema } = await import('../models/chat.model.js');
            const { userSchema } = await import('../models/user.model.js');
            const { ConsentSchema } = await import('../models/consent.model.js');
            const { UsageLogSchema } = await import('../models/usageLog.model.js');
            const { userTokenSchema } = await import('../models/userToken.model.js');
            
            const appId = (socket as any).appId || 'app1';
            const connection = getDbConnection(appId);
            
            // Create a mock request with database models attached
            const mockReq = {
                body: { message },
                user: { _id: socket.userId },
                appId: appId,
                // Attach app-specific models
                Chat: connection.model('Chat', chatSchema),
                User: connection.model('User', userSchema),
                Consent: connection.model('Consent', ConsentSchema),
                UsageLog: connection.model('UsageLog', UsageLogSchema),
                UserToken: connection.model('UserToken', userTokenSchema)
            } as any;
            
            // Only add ChatbotProfile for App1
            if (appId === 'app1') {
                const { ChatbotProfileSchema } = await import('../models/chatbotProfile.model.js');
                mockReq.ChatbotProfile = connection.model('ChatbotProfile', ChatbotProfileSchema);
            }
            
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
            // Import chat controller functions and database utilities
            const { sendStreamingMessage } = await import('../controllers/chat.controller.js');
            const { getDbConnection } = await import('../db/index.js');
            const { chatSchema } = await import('../models/chat.model.js');
            const { userSchema } = await import('../models/user.model.js');
            const { ConsentSchema } = await import('../models/consent.model.js');
            const { UsageLogSchema } = await import('../models/usageLog.model.js');
            const { userTokenSchema } = await import('../models/userToken.model.js');
            
            const appId = (socket as any).appId || 'app1';
            const connection = getDbConnection(appId);
            
            // Create a mock request with database models attached
            const mockReq = {
                body: { chatId, message },
                user: { _id: socket.userId },
                appId: appId,
                // Attach app-specific models
                Chat: connection.model('Chat', chatSchema),
                User: connection.model('User', userSchema),
                Consent: connection.model('Consent', ConsentSchema),
                UsageLog: connection.model('UsageLog', UsageLogSchema),
                UserToken: connection.model('UserToken', userTokenSchema)
            } as any;
            
            // Only add ChatbotProfile for App1
            if (appId === 'app1') {
                const { ChatbotProfileSchema } = await import('../models/chatbotProfile.model.js');
                mockReq.ChatbotProfile = connection.model('ChatbotProfile', ChatbotProfileSchema);
            }
            
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