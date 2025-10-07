import 'dart:async';
import 'api_service.dart';
import 'websocket_service.dart';

class Message {
  final String id;
  final String content;
  final String role; // 'user' or 'assistant'
  final DateTime timestamp;

  Message({
    required this.id,
    required this.content,
    required this.role,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isFromUser => role == 'user';
  String get text => content; // For backward compatibility
}

class ChatSession {
  final String id;
  final String title;
  final List<Message> messages;
  final int? totalMessages; // Add totalMessages field
  final DateTime createdAt;
  final DateTime updatedAt;

  ChatSession({
    required this.id,
    required this.title,
    required this.messages,
    this.totalMessages,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    // Handle both cases: with messages (full chat) and without messages (chat list)
    List<Message> messageList = [];
    
    if (json['messages'] != null) {
      // Full chat with messages
      messageList = (json['messages'] as List)
          .map((msg) => Message(
                id: msg['_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
                content: msg['content'],
                role: msg['role'],
                timestamp: DateTime.parse(msg['timestamp']),
              ))
          .toList();
    }
    // If no messages field, it's just metadata (from getUserChats endpoint)

    return ChatSession(
      id: json['_id'],
      title: json['title'],
      messages: messageList,
      totalMessages: json['totalMessages'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class ChatService {
  ChatService._();
  static final instance = ChatService._();

  final _apiService = ApiService.instance;
  final _webSocketService = WebSocketService.instance;
  final List<Message> _messages = [];
  String? _currentChatId;
  String? _currentChatTitle;
  
  // Streaming state
  bool _isStreaming = false;
  String _currentStreamingMessage = '';
  String? _streamingMessageId;
  String _lastReceivedChunk = '';
  final _streamingController = StreamController<String>.broadcast();
  final _messagesController = StreamController<List<Message>>.broadcast();
  final _currentChatController = StreamController<String?>.broadcast();
  bool _listenersSetup = false; // Track if listeners are already set up
  
  // Public streams and getters
  Stream<String> get streamingMessageStream => _streamingController.stream;
  Stream<List<Message>> get messagesStream => _messagesController.stream;
  Stream<String?> get currentChatStream => _currentChatController.stream;
  List<Message> get messages => List.unmodifiable(_messages);
  String? get currentChatId => _currentChatId;
  String? get currentChatTitle => _currentChatTitle;
  // Public API to set chat title (updates state and notifies listeners)
  void setCurrentChatTitle(String? title) {
    _currentChatTitle = title;
    try {
      _currentChatController.add(_currentChatId);
    } catch (e) {
      print('Error emitting currentChat after title set: $e');
    }
  }
  bool get isStreaming => _isStreaming;
  String get currentStreamingMessage => _currentStreamingMessage;

  /// Initialize chat service and WebSocket
  Future<void> initialize() async {
    // Avoid multiple initializations
    if (_webSocketService.isConnected && _listenersSetup) {
      print('🔄 ChatService already initialized, skipping...');
      return;
    }
      if (_listenersSetup) {
        print('⚠️ ChatService listeners already set up, skipping duplicate initialization');
        return;
      }
    
    await _webSocketService.initialize();
    if (!_listenersSetup) {
      _setupStreamingListeners();
      _listenersSetup = true;
    }
  }

  /// Reinitialize connection (for refresh button)
  Future<void> reinitialize() async {
    print('🔄 Reinitializing ChatService...');
    await _webSocketService.disconnect();
    _listenersSetup = false;
    await initialize();
  }

  /// Setup WebSocket streaming listeners (only once)
  void _setupStreamingListeners() {
    print('🎧 Setting up streaming listeners...');
    
    // Listen for AI response chunks
    _webSocketService.aiResponseStream.listen((chunk) {
      print('📨 Received chunk: "$chunk" (current: "${_currentStreamingMessage}")');
      
      // Only process if we're actively streaming
      if (_isStreaming && _streamingMessageId != null) {
        // Only append non-empty chunks
        final trimmed = chunk.trim();
        if (trimmed.isNotEmpty) {
          // Ignore exact duplicate chunks received consecutively
          if (trimmed == _lastReceivedChunk) {
            print('⚠️ Ignoring exact duplicate chunk: "${trimmed}"');
          } else {
            _lastReceivedChunk = trimmed;
            // Append only the non-overlapping suffix to avoid duplication
            final curr = _currentStreamingMessage;
            final incoming = chunk;
            final maxOverlap = curr.length < incoming.length ? curr.length : incoming.length;
            int overlap = 0;
            for (int k = maxOverlap; k > 0; k--) {
              if (curr.endsWith(incoming.substring(0, k))) {
                overlap = k;
                break;
              }
            }
            final toAppend = incoming.substring(overlap);
            if (toAppend.isNotEmpty) {
              _currentStreamingMessage += toAppend;
            } else {
              print('⚠️ Incoming chunk fully overlaps existing content, skipping append');
            }
          }
        }
        // Emit the FULL message so far (not just the chunk)
        _streamingController.add(_currentStreamingMessage);
        print('📤 Emitted accumulated message: "${_currentStreamingMessage}"');
      }
    });
    
    // Listen for AI response completion
    _webSocketService.aiCompleteStream.listen((data) {
      print('✅ AI response completed');
      _finishStreamingMessage(data);
    });
  }
  
  /// Finish streaming message and add to chat
  void _finishStreamingMessage(Map<String, dynamic> data) {
    print('🏁 Finishing streaming message. Current: "${_currentStreamingMessage}", ID: $_streamingMessageId');
    
    if (_currentStreamingMessage.isNotEmpty && _streamingMessageId != null) {
      // Add the complete AI message to the messages list
      final aiMessage = Message(
        id: _streamingMessageId!,
        content: _currentStreamingMessage,
        role: 'assistant',
      );
      
      _messages.add(aiMessage);
      _notifyMessagesChanged();
      print('✅ Added final message to chat: "${_currentStreamingMessage}"');
    }
    
    // Update chat ID if this was a new chat
    if (data['chatId'] != null) {
      _currentChatId = data['chatId'];
      print('📍 Updated chat ID: $_currentChatId');
      // Notify listeners (e.g., drawer) that current chat changed
      try {
        _currentChatController.add(_currentChatId);
      } catch (e) {
        print('Error emitting currentChat change: $e');
      }
    }
    // Update chat title if present in backend response
    if (data['title'] != null && data['title'] is String && data['title'].isNotEmpty) {
      _currentChatTitle = data['title'];
      print('📝 Updated chat title: $_currentChatTitle');
      // Notify listeners that current chat metadata changed (title updated)
      try {
        _currentChatController.add(_currentChatId);
      } catch (e) {
        print('Error emitting currentChat after title update: $e');
      }
    }
    
    // Reset streaming state
    _isStreaming = false;
    _currentStreamingMessage = '';
    _streamingMessageId = null;
    _streamingController.add(''); // Signal streaming is complete
    print('🔄 Streaming state reset');
  }
  
  /// Notify listeners that messages have changed
  void _notifyMessagesChanged() {
    _messagesController.add(List.unmodifiable(_messages));
  }

  void _setMessages(List<Message> messages) {
    _messages.clear();
    _messages.addAll(messages);
  }

  void clearMessages() {
    _messages.clear();
    _currentChatId = null;
    _currentChatTitle = null;
    // Notify listeners that current chat cleared
    try {
      _currentChatController.add(null);
    } catch (e) {
      print('Error emitting currentChat clear: $e');
    }
  }

  // Load recent chat when app starts (like ChatGPT)
  Future<bool> loadRecentChat() async {
    try {
      final response = await _apiService.getRecentChat();
      
      if (response['ok'] == true && response['data']['hasRecentChat'] == true) {
        final chatData = response['data']['chat'];
        final session = ChatSession.fromJson(chatData);
        
        _currentChatId = session.id;
        _currentChatTitle = session.title;
        // Notify listeners about current chat
        try {
          _currentChatController.add(_currentChatId);
        } catch (e) {
          print('Error emitting currentChat from loadRecentChat: $e');
        }
        _setMessages(session.messages);
        
        return true;
      }
      
      // No recent chat, start fresh
      clearMessages();
      return false;
    } catch (e) {
      print('Error loading recent chat: $e');
      return false;
    }
  }

  // Send message with real-time streaming
  Future<String> sendMessage(String userMessage) async {
    try {
      // CRITICAL: Reset streaming state completely before new message
      _isStreaming = false;
      _currentStreamingMessage = '';
      _streamingMessageId = null;
      
      // Add user message immediately to UI
      final userMsg = Message(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: userMessage,
        role: 'user',
      );
      
      _messages.add(userMsg);
      _notifyMessagesChanged();
      
      // Prepare for streaming AI response
      _isStreaming = true;
      _currentStreamingMessage = ''; // Ensure it's truly empty
      _streamingMessageId = DateTime.now().millisecondsSinceEpoch.toString() + '_ai';
      
      if (_currentChatId == null) {
        // Start new chat with streaming
        await _webSocketService.startChatWithStreaming(userMessage);
        // Note: We'll join the chat room when we get the chatId from the response
      } else {
        // Join the chat room first to receive streaming events
        await _webSocketService.joinChatRoom(_currentChatId!);
        // Continue existing chat with streaming
        await _webSocketService.sendStreamingMessage(_currentChatId!, userMessage);
      }
      
      return 'Message sent with streaming';
    } catch (e) {
      print('❌ Error sending streaming message: $e');
      _isStreaming = false;
      _currentStreamingMessage = '';
      _streamingMessageId = null;
      return 'Error: $e';
    }
  }

  // Get all user chats for chat history
  Future<List<ChatSession>> getUserChats({int page = 1, int limit = 10}) async {
    try {
      final response = await _apiService.getUserChats(page: page, limit: limit);
      
      if (response['ok'] == true) {
        final data = response['data'];
        if (data != null && data['chats'] != null) {
          final chats = data['chats'] as List;
          return chats.map((chat) => ChatSession.fromJson(chat)).toList();
        }
      }
      
      // Return empty list if no chats or error
      return [];
    } catch (e) {
      print('Error getting user chats: $e');
      return [];
    }
  }

  // Switch to a different chat
  Future<bool> loadChat(String chatId) async {
    try {
      final response = await _apiService.getChatById(chatId);
      
      if (response['ok'] == true) {
        final chatData = response['data']['chat'];
        final session = ChatSession.fromJson(chatData);
        
        _currentChatId = session.id;
        _currentChatTitle = session.title;
        _setMessages(session.messages);
        
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error loading chat: $e');
      return false;
    }
  }

  // Delete message from current chat
  Future<bool> deleteMessage(String messageId) async {
    if (_currentChatId == null) return false;
    
    try {
      final response = await _apiService.deleteMessage(_currentChatId!, messageId);
      
      if (response['ok'] == true) {
        // Remove message from local list
        _messages.removeWhere((msg) => msg.id == messageId);
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error deleting message: $e');
      return false;
    }
  }

  // Delete entire chat
  Future<bool> deleteChat(String chatId) async {
    try {
      final response = await _apiService.deleteChat(chatId);
      
      if (response['ok'] == true) {
        // If it's the current chat, clear it
        if (_currentChatId == chatId) {
          clearMessages();
        }
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error deleting chat: $e');
      return false;
    }
  }

  // Check if message/chat can be deleted (within 15-minute window)
  Future<Map<String, dynamic>> checkDeletionEligibility(String chatId, {String? messageId}) async {
    try {
      final response = await _apiService.checkDeletionEligibility(chatId, messageId: messageId);
      return response;
    } catch (e) {
      print('Error checking deletion eligibility: $e');
      return {
        'ok': false,
        'message': 'Error checking deletion status: $e'
      };
    }
  }

  /// Dispose resources
  void dispose() {
    _streamingController.close();
    _messagesController.close();
    _webSocketService.dispose();
  }

}
