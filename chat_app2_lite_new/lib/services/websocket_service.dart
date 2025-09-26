import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'auth_service.dart';
import 'api_service.dart';

class WebSocketService {
  WebSocketService._();
  static final instance = WebSocketService._();
  
  IO.Socket? _socket;
  bool _isConnected = false;
  bool _listenersRegistered = false;
  final Set<String> _joinedRooms = {}; // Track joined chat rooms
  bool _manualDisconnect = false;
  int _reconnectAttempts = 0;
  final int _maxReconnectAttempts = 6;
  final Duration _reconnectBaseDelay = Duration(seconds: 2);
  
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
    // Check if already connected
    if (_isConnected && _socket != null) {
      print('✅ WebSocket already connected, skipping initialization');
      return;
    }
    
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
      // Double-check connection status before creating new socket
      if (_isConnected && _socket != null && _socket!.connected) {
        print('✅ WebSocket already connected and active, skipping connect');
        return;
      }
      
      // Disconnect existing socket if any
      if (_socket != null) {
        print('🔄 Disconnecting existing socket before reconnecting');
        _socket!.disconnect();
        _socket!.dispose();
        _socket = null;
        _isConnected = false;
      }
      
      print('🔌 Connecting to WebSocket server...');
      
      _manualDisconnect = false;
  // Use the centralized ApiService.baseUrl so HTTP and WS targets match
  final wsUrl = ApiService.baseUrl; // socket_io_client accepts the http URL
  _socket = IO.io(wsUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'auth': {'token': token, 'appId': 'app2'},
        'forceNew': true, // Force new connection
      });
      
      _setupEventListeners();
      _socket!.connect();
      
    } catch (e) {
        print('❌ WebSocket connection error: $e');
        _isConnected = false;
        _connectionController.add(_isConnected);
        // Schedule a reconnect attempt when connect() throws
        _scheduleReconnect(token);
    }
  }
  
  /// Setup event listeners for WebSocket
  void _setupEventListeners() {
    if (_socket == null) return;
    if (_listenersRegistered) {
      print('⚠️ WebSocket listeners already registered for App2, skipping duplicate setup');
      return;
    }
    _listenersRegistered = true;
    
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
      if (!_manualDisconnect) {
        // Try to reconnect automatically
        final token = AuthService.instance.currentUser?.token;
        if (token != null) _scheduleReconnect(token);
      }
    });
    
    _socket!.onConnectError((error) {
      print('❌ WebSocket connection error: $error');
      _isConnected = false;
      _connectionController.add(_isConnected);
      // Connection errors should trigger a reconnect with backoff
      final token = AuthService.instance.currentUser?.token;
      if (token != null) _scheduleReconnect(token);
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
    
    // Check if already joined this room
    if (_joinedRooms.contains(chatId)) {
      print('✅ Already joined chat room: $chatId, skipping');
      return;
    }
    
    print('🏠 Joining chat room: $chatId');
    _socket!.emit('join_chat', {'chatId': chatId});
    _joinedRooms.add(chatId);
  }
  
  /// Leave a specific chat room
  Future<void> leaveChatRoom(String chatId) async {
    if (!_isConnected || _socket == null) {
      print('🚫 WebSocket not connected - cannot leave chat room');
      return;
    }
    
    print('🚪 Leaving chat room: $chatId');
    _socket!.emit('leave_chat', {'chatId': chatId});
    _joinedRooms.remove(chatId);
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
    // Mark that this was a user-initiated disconnect so reconnect won't fire
    _manualDisconnect = true;
    if (_socket != null) {
      print('🔌 Disconnecting WebSocket...');
      try {
        _socket!.disconnect();
        _socket!.dispose();
      } catch (e) {
        print('Error while disposing socket: $e');
      }
      _socket = null;
    }
    _isConnected = false;
    _joinedRooms.clear(); // Clear joined rooms on disconnect
    // Allow listeners to be re-registered on next connect
    _listenersRegistered = false;
    _reconnectAttempts = 0;
    _connectionController.add(_isConnected);
  }

  void _scheduleReconnect(String token) {
    if (_manualDisconnect) return; // don't reconnect after manual disconnect
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      print('⚠️ Max reconnect attempts reached ($_reconnectAttempts) - giving up');
      return;
    }
    _reconnectAttempts += 1;
    final delay = _reconnectBaseDelay * _reconnectAttempts;
    print('⏳ Scheduling reconnect attempt #${_reconnectAttempts} in ${delay.inSeconds}s');
    Future.delayed(delay, () async {
      if (_manualDisconnect) return;
      print('🔄 Attempting reconnect #${_reconnectAttempts}');
      await connect(token);
    });
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