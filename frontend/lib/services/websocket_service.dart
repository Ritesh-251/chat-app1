import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'auth_service.dart';

class WebSocketService {
  WebSocketService._();
  static final instance = WebSocketService._();
  
  IO.Socket? _socket;
  bool _isConnected = false;
  
  // Stream controllers for different events
  final _aiResponseController = StreamController<String>.broadcast();
  final _aiCompleteController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();
  
  // Public streams
  Stream<String> get aiResponseStream => _aiResponseController.stream;
  Stream<Map<String, dynamic>> get aiCompleteStream => _aiCompleteController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;
  
  bool get isConnected => _isConnected;
  
  /// Initialize WebSocket connection
  Future<void> initialize() async {
    final currentUser = AuthService.instance.currentUser;
    if (currentUser == null) {
      print('🚫 No authenticated user - cannot initialize WebSocket');
      return;
    }
    
    print('🔑 User token available, connecting to WebSocket...');
    await connect(currentUser.token);
  }
  
  /// Connect to WebSocket server
  Future<void> connect(String token) async {
    try {
      print('🔌 Connecting to WebSocket server...');
      
      _socket = IO.io('http://10.6.192.157:8000', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'auth': {'token': token},
      });
      
      _setupEventListeners();
      _socket!.connect();
      
    } catch (e) {
      print('❌ WebSocket connection error: $e');
      _isConnected = false;
      _connectionController.add(_isConnected);
    }
  }
  
  /// Setup event listeners for WebSocket
  void _setupEventListeners() {
    if (_socket == null) return;
    
    // Connection events
    _socket!.onConnect((_) {
      print('✅ WebSocket connected');
      _isConnected = true;
      _connectionController.add(_isConnected);
    });
    
    _socket!.onDisconnect((_) {
      print('❌ WebSocket disconnected');
      _isConnected = false;
      _connectionController.add(_isConnected);
    });
    
    _socket!.onConnectError((error) {
      print('❌ WebSocket connection error: $error');
      _isConnected = false;
      _connectionController.add(_isConnected);
    });
    
    // Authentication events
    _socket!.on('authentication_failed', (data) {
      print('🚫 WebSocket authentication failed: $data');
      disconnect();
    });
    
    _socket!.on('authenticated', (data) {
      print('🔐 WebSocket authenticated for user: ${data['userId']}');
    });
    
    // AI response events
    _socket!.on('ai_response_chunk', (data) {
      print('📝 AI chunk received: ${data['chunk']}');
      _aiResponseController.add(data['chunk']);
    });
    
    _socket!.on('ai_response_complete', (data) {
      print('✅ AI response complete');
      _aiCompleteController.add(data);
    });
    
    // Chat events
    _socket!.on('chat_started', (data) {
      print('💬 Chat started: ${data['data']['chatId']}');
      final chatId = data['data']['chatId'];
      if (chatId != null) {
        // Automatically join the chat room to receive streaming events
        joinChatRoom(chatId);
      }
    });
    
    _socket!.on('message_saved', (data) {
      print('💾 Message saved: ${data['messageId']}');
    });
    
    // Error events
    _socket!.on('error', (error) {
      print('❌ WebSocket error: $error');
    });
  }
  
  /// Start a new chat with streaming
  Future<void> startChatWithStreaming(String userMessage) async {
    if (!_isConnected || _socket == null) {
      print('🚫 WebSocket not connected - cannot start chat');
      return;
    }
    
    print('🚀 Starting chat with streaming message: $userMessage');
    _socket!.emit('start_chat_with_streaming', {
      'message': userMessage,
    });
  }
  
  /// Send a streaming message to existing chat
  Future<void> sendStreamingMessage(String chatId, String userMessage) async {
    if (!_isConnected || _socket == null) {
      print('🚫 WebSocket not connected - cannot send message');
      return;
    }
    
    print('📤 Sending streaming message to chat $chatId: $userMessage');
    _socket!.emit('send_streaming_message', {
      'chatId': chatId,
      'message': userMessage,
    });
  }
  
  /// Join a specific chat room
  Future<void> joinChatRoom(String chatId) async {
    if (!_isConnected || _socket == null) {
      print('🚫 WebSocket not connected - cannot join chat room');
      return;
    }
    
    print('🏠 Joining chat room: $chatId');
    _socket!.emit('join_chat', {'chatId': chatId});
  }
  
  /// Leave a specific chat room
  Future<void> leaveChatRoom(String chatId) async {
    if (!_isConnected || _socket == null) {
      print('🚫 WebSocket not connected - cannot leave chat room');
      return;
    }
    
    print('🚪 Leaving chat room: $chatId');
    _socket!.emit('leave_chat', {'chatId': chatId});
  }
  
  /// Send typing indicator
  Future<void> sendTyping(String chatId, bool isTyping) async {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('typing', {
      'chatId': chatId,
      'isTyping': isTyping,
    });
  }
  
  /// Disconnect WebSocket
  Future<void> disconnect() async {
    if (_socket != null) {
      print('🔌 Disconnecting WebSocket...');
      _socket!.disconnect();
      _socket = null;
    }
    _isConnected = false;
    _connectionController.add(_isConnected);
  }
  
  /// Reconnect with new token
  Future<void> reconnectWithToken(String newToken) async {
    await disconnect();
    await connect(newToken);
  }
  
  /// Dispose resources
  void dispose() {
    disconnect();
    _aiResponseController.close();
    _aiCompleteController.close();
    _connectionController.close();
  }
}