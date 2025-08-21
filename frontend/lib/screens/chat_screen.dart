import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/chat_history_drawer.dart';
import '../widgets/delete_confirmation_popup.dart';
import '../screens/login_screen.dart';

class ChatScreen extends StatefulWidget {
  static const route = '/chat';
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _chatService = ChatService.instance;
  bool _isLoading = false;
  bool _isConnected = true;
  final Map<String, bool> _messageCanDelete = {}; // Track which messages can be deleted

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _checkMessageDeletionEligibility() async {
    if (_chatService.currentChatId == null) return;
    
    final messages = _chatService.messages;
    for (final message in messages) {
      if (message.isFromUser) {
        try {
          final response = await _chatService.checkDeletionEligibility(
            _chatService.currentChatId!,
            messageId: message.id,
          );
          if (response['ok'] == true && response['data'] != null) {
            final canDelete = response['data']['canDelete'] ?? false;
            setState(() {
              _messageCanDelete[message.id] = canDelete;
            });
          }
        } catch (e) {
          print('Error checking deletion eligibility for message ${message.id}: $e');
        }
      }
    }
  }

  Future<void> _deleteMessage(String messageId) async {
    try {
      final success = await _chatService.deleteMessage(messageId);
      if (mounted) {
        if (success) {
          setState(() {
            _messageCanDelete.remove(messageId);
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Message deleted successfully'),
              backgroundColor: Color(0xFF3E6C42),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to delete message. You can only delete messages within 15 minutes.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting message: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _initializeChat() async {
    // Check backend connection
    final connected = await _chatService.checkBackendConnection();
    if (mounted) {
      setState(() {
        _isConnected = connected;
      });
      
      if (connected) {
        // Try to load recent chat (like ChatGPT)
        final hasRecentChat = await _chatService.loadRecentChat();
        if (mounted) {
          setState(() {
            // UI will rebuild with loaded messages
          });
          // Check deletion eligibility for loaded messages
          _checkMessageDeletionEligibility();
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Warning: Backend server not reachable. Please check if your server is running.'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading) return;
    
    _controller.clear();
    setState(() {
      _isLoading = true;
    });

    try {
      final aiResponse = await _chatService.sendMessage(text);
      if (mounted) {
        setState(() {
          // UI will rebuild and show updated messages from ChatService
        });
        
        // Check deletion eligibility for new messages
        _checkMessageDeletionEligibility();
        
        // Show success feedback if it's an error message
        if (aiResponse.contains('Error:') || aiResponse.contains('Failed')) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(aiResponse)),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error sending message: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _switchToChat(String chatId, String title) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final success = await _chatService.loadChat(chatId);
      if (mounted) {
        if (success) {
          setState(() {
            // UI will rebuild with new chat messages
            _messageCanDelete.clear(); // Clear previous deletion status
          });
          // Check deletion eligibility for loaded chat messages
          _checkMessageDeletionEligibility();
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Switched to "$title"'),
              duration: const Duration(seconds: 2),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to load chat')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading chat: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _startNewChat() {
    setState(() {
      _chatService.clearMessages();
      _messageCanDelete.clear(); // Clear deletion status
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Started new chat'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _onChatDeleted() {
    // Called when current chat is deleted from drawer
    setState(() {
      _chatService.clearMessages();
      _messageCanDelete.clear();
    });
  }

  Widget _buildChatInputBar() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            // Input field
            Expanded(
              child: TextField(
                controller: _controller,
                enabled: !_isLoading,
                decoration: InputDecoration(
                  hintText: "Type a message...",
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                      vertical: 12, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: const BorderSide(color: Color(0xFF3E6C42), width: 2),
                  ),
                ),
                minLines: 1,
                maxLines: 5,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),

            const SizedBox(width: 8),

            // Send button
            Container(
              decoration: const BoxDecoration(
                color: Color(0xFF3E6C42), // Using your app's green theme
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: _isLoading 
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send, color: Colors.white, size: 22),
                onPressed: _isLoading ? null : _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final messages = _chatService.messages;
    
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Expanded(
              child: Text(
                _chatService.currentChatTitle ?? 'AI Chat Assistant',
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            if (!_isConnected)
              const Icon(Icons.cloud_off, color: Colors.orange, size: 20),
            if (_isConnected)
              const Icon(Icons.cloud_done, color: Colors.green, size: 20),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _initializeChat,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _startNewChat,
            tooltip: 'New Chat',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (mounted) Navigator.pushReplacementNamed(context, LoginScreen.route);
            },
          )
        ],
      ),
      drawer: ChatHistoryDrawer(
        onChatSelected: _switchToChat,
        onNewChat: _startNewChat,
        onChatDeleted: _onChatDeleted,
      ),
      body: Column(
        children: [
          if (!_isConnected)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              color: Colors.orange.shade100,
              child: const Text(
                'Backend server not reachable. Messages will fail until server is running.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.orange),
              ),
            ),
          Expanded(
            child: messages.isEmpty
                ? const Center(
                    child: Text(
                      'Start a conversation with your AI assistant!\nType a message below to begin.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final canDelete = _messageCanDelete[msg.id] ?? false;
                      
                      return ChatBubble(
                        text: msg.text, 
                        fromUser: msg.isFromUser,
                        messageId: msg.id,
                        canDelete: canDelete,
                        onDelete: canDelete ? () => _deleteMessage(msg.id) : null,
                      );
                    },
                  ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 8),
                  Text('AI is thinking...'),
                ],
              ),
            ),
          _buildChatInputBar(),
        ],
      ),
    );
  }
}