import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../services/chat_service.dart';

class ChatHistoryDrawer extends StatefulWidget {
  final Function(String chatId, String title) onChatSelected;
  final Function() onNewChat;
  final Function()? onChatDeleted; // Add callback for when chat is deleted

  const ChatHistoryDrawer({
    super.key,
    required this.onChatSelected,
    required this.onNewChat,
    this.onChatDeleted,
  });

  @override
  State<ChatHistoryDrawer> createState() => _ChatHistoryDrawerState();
}

class _ChatHistoryDrawerState extends State<ChatHistoryDrawer> {
  final _chatService = ChatService.instance;
  List<ChatSession> _chats = [];
  bool _isLoading = true;
  String? _currentChatId;

  @override
  void initState() {
    super.initState();
    _loadChatHistory();
    _currentChatId = _chatService.currentChatId;
  }

  Future<void> _deleteChat(String chatId, String title) async {
    try {
      final success = await _chatService.deleteChat(chatId);
      if (mounted) {
        if (success) {
          // Remove chat from local list
          setState(() {
            _chats.removeWhere((chat) => chat.id == chatId);
          });
          
          // If it was the current chat, notify parent
          if (_currentChatId == chatId) {
            widget.onChatDeleted?.call();
          }
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Chat "$title" deleted successfully'),
              backgroundColor: const Color(0xFF3E6C42),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to delete chat. You can only delete chats within 15 minutes.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting chat: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showDeleteChatDialog(String chatId, String title) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 320),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FBF5), // cream background
            borderRadius: BorderRadius.circular(16), // rounded-2xl
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Delete Icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.delete_outline,
                  color: Colors.red.shade600,
                  size: 28,
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Title
              const Text(
                'Delete Chat',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 8),
              
              // Message
              Text(
                'Are you sure you want to delete "$title"? This action cannot be undone.',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 24),
              
              // Action Buttons
              Row(
                children: [
                  // Cancel Button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey.shade100,
                        foregroundColor: Colors.grey.shade700,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey.shade300),
                        ),
                      ),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                  
                  const SizedBox(width: 12),
                  
                  // Delete Button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        _deleteChat(chatId, title);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade600,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Delete',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _loadChatHistory() async {
    if (!mounted) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      final chats = await _chatService.getUserChats(limit: 20);
      if (mounted) {
        setState(() {
          _chats = chats ?? []; // Ensure we have a list even if null
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading chat history: $e');
      if (mounted) {
        setState(() {
          _chats = []; // Set empty list on error
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading chat history: $e')),
        );
      }
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFFF9FBF5), // light cream background
      child: Column(
        children: [
          // Custom Header with green theme
          Container(
              height: 131.3,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.green.shade700,
                    Colors.green.shade300,
                    Colors.green.shade700,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(20),
                  bottomRight: Radius.circular(20),
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      const Icon(
                        Icons.chat_bubble_outline,
                        color: Colors.white,
                        size: 28,
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Chat History',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      /*const Text(
                        'Your conversations',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),*/
                    ],
                  ),
                ),
              ),
            ),

                      
          // New Chat Button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                widget.onNewChat();
              },
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text(
                "New Chat",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50), // match ChatScreen input button
                ),
                elevation: 4,
              ),
            ),
          ),
          
          // Chat List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF3E6C42),
                    ),
                  )
                : _chats.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.chat_bubble_outline,
                              size: 45,
                              color: Colors.grey.shade500,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No conversations yet',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey.shade700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Start a new chat to see it here',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade500,
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadChatHistory,
                        color: const Color(0xFF3E6C42),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          itemCount: _chats.length,
                          itemBuilder: (context, index) {
                            final chat = _chats[index];
                            final isCurrentChat = chat.id == _currentChatId;
                            
                            return Container(
                              margin: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                               decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.05),
                                        blurRadius: 6,
                                        offset: const Offset(2, 2),
                                      ),
                                    ],
                                border: isCurrentChat
                                    ? Border.all(
                                        color: Colors.green.shade700,
                                        width: 2,
                                      )
                                      //second border all removed in new code
                                    : Border.all(
                                        color: Colors.grey.shade200,
                                        width: 1,
                                      ),
                              ),
                              child: GestureDetector(
                                // Long press for mobile
                                onLongPress: () => _showDeleteChatDialog(chat.id, chat.title),
                                // Right click for web/desktop (optional)
                                onSecondaryTap: kIsWeb ? () => _showDeleteChatDialog(chat.id, chat.title) : null,
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  leading: CircleAvatar(
                                    backgroundColor: isCurrentChat ? Colors.green.shade700 : Colors.grey.shade300,
                                child: Icon(
                                  Icons.chat,
                                  color: isCurrentChat ? Colors.white : Colors.grey.shade600,
                                  size: 20,
                                ),
                              ),
                              title: Text(
                                chat.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontWeight: isCurrentChat
                                          ? FontWeight.bold
                                          : FontWeight.w500,
                                      color: isCurrentChat
                                          ? Colors.green.shade700
                                          : Colors.grey.shade800,
                                    ),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (chat.messages.isNotEmpty)
                                        Text(
                                          chat.messages.last.content,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade600,
                                          ),
                                        )
                                      else if (chat.totalMessages != null)
                                        Text(
                                          '${chat.totalMessages} messages',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _formatTimestamp(chat.updatedAt),
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey.shade500,
                                        ),
                                      ),
                                    ],
                                  ),
                                  trailing: isCurrentChat
                                      ? const Icon(
                                          Icons.check_circle,
                                          color: Colors.green,
                                          size: 20,
                                        )
                                      : null,
                                  onTap: () {
                                    Navigator.pop(context);
                                    if (!isCurrentChat) {
                                      widget.onChatSelected(chat.id, chat.title);
                                    }
                                  },
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
          
          // Bottom Refresh Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                top: BorderSide(color: Colors.grey.shade300),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton.icon(
                  onPressed: _loadChatHistory,
                  icon: const Icon(
                    Icons.refresh,
                    color: Color(0xFF3E6C42),
                    size: 18,
                  ),
                  label: const Text(
                    'Refresh',
                    style: TextStyle(
                      color: Color(0xFF3E6C42),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Text(
                  '${_chats.length} chats',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
