import 'api_service.dart';

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
  final List<Message> _messages = [];
  String? _currentChatId;
  String? _currentChatTitle;

  List<Message> get messages => List.unmodifiable(_messages);
  String? get currentChatId => _currentChatId;
  String? get currentChatTitle => _currentChatTitle;

  void _setMessages(List<Message> messages) {
    _messages.clear();
    _messages.addAll(messages);
  }

  void clearMessages() {
    _messages.clear();
    _currentChatId = null;
    _currentChatTitle = null;
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

  // Send message (either start new chat or continue existing)
  Future<String> sendMessage(String userMessage) async {
    try {
      if (_currentChatId == null) {
        // Start new chat with first message
        final response = await _apiService.startChatWithMessage(userMessage);
        
        if (response['ok'] == true) {
          final data = response['data'];
          _currentChatId = data['chatId'];
          _currentChatTitle = data['title'];
          
          // Clear any existing messages and load the new chat
          _messages.clear();
          
          // Add messages from the response
          if (data['messages'] != null) {
            final messages = (data['messages'] as List)
                .map((msg) => Message(
                      id: msg['_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
                      content: msg['content'],
                      role: msg['role'],
                      timestamp: DateTime.parse(msg['timestamp']),
                    ))
                .toList();
            _setMessages(messages);
          }
          
          return data['aiResponse'] ?? 'Chat started successfully!';
        } else {
          return response['message'] ?? 'Failed to start chat';
        }
      } else {
        // Continue existing chat
        final response = await _apiService.sendMessageWithAI(_currentChatId!, userMessage);
        
        if (response['ok'] == true) {
          final data = response['data'];
          final aiResponse = data['aiResponse'];
          
          // Add user message locally (immediate UI update)
          _messages.add(Message(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            content: userMessage,
            role: 'user',
          ));
          
          // Add AI response
          _messages.add(Message(
            id: DateTime.now().millisecondsSinceEpoch.toString() + '1',
            content: aiResponse,
            role: 'assistant',
          ));
          
          return aiResponse;
        } else {
          return response['message'] ?? 'Failed to send message';
        }
      }
    } catch (e) {
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

}
