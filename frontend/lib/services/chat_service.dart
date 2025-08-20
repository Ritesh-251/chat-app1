import 'api_service.dart';

class Message {
  final String text;
  final bool isFromUser;
  final DateTime timestamp;

  Message({
    required this.text,
    required this.isFromUser,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class ChatService {
  ChatService._();
  static final instance = ChatService._();

  final _apiService = ApiService.instance;
  final List<Message> _messages = [];

  List<Message> get messages => List.unmodifiable(_messages);

  void addMessage(Message message) {
    _messages.add(message);
  }

  void clearMessages() {
    _messages.clear();
  }

  Future<String> sendMessage(String userMessage) async {
    // Add user message to chat
    addMessage(Message(text: userMessage, isFromUser: true));

    try {
      // Send to your backend
      final response = await _apiService.sendMessage(userMessage);
      final botReply = response['reply'] ?? 'Sorry, I couldn\'t process your message.';
      
      // Add bot response to chat
      addMessage(Message(text: botReply, isFromUser: false));
      
      return botReply;
    } catch (e) {
      final errorMessage = 'Error: $e';
      addMessage(Message(text: errorMessage, isFromUser: false));
      return errorMessage;
    }
  }

  // Method to check if backend is available
  Future<bool> checkBackendConnection() async {
    return await _apiService.isServerReachable();
  }
}
