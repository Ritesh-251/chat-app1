import 'dart:async';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/chat_history_drawer.dart';
import '../widgets/delete_confirmation_popup.dart';
import '../widgets/typing_indicator.dart';
import '../screens/login_screen.dart';
import '../services/app_usage_service.dart';
import '../services/consent_service.dart';
import '../services/usage_service.dart';

class ChatScreen extends StatefulWidget {
  static const route = '/chat';
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController(); // Add scroll controller
  final _chatService = ChatService.instance;
  bool _isLoading = false;
  bool _isConnected = true;
  final Map<String, bool> _messageCanDelete = {}; // Track which messages can be deleted
  String _currentStreamingText = ''; // Track streaming AI response

  bool _appUsageConsent = false;
  
  
  // Stream subscriptions for proper disposal
  StreamSubscription? _streamingMessageSubscription;
  StreamSubscription? _messagesSubscription;

  @override
  void initState() {
    super.initState();
    _initializeChat();
    _setupStreamingListeners();
    _sendUsageLogsIfConsented();
  }

  /// Setup listeners for processed chat data from ChatService
  void _setupStreamingListeners() {
    print('ChatScreen: Setting up streaming listeners');
    
    // Cancel existing subscriptions if any
    _streamingMessageSubscription?.cancel();
    _messagesSubscription?.cancel();
    
    // Listen to streaming messages from ChatService
    _streamingMessageSubscription = _chatService.streamingMessageStream.listen((streamingText) {
      print('ChatScreen: Received streaming text update: ${streamingText.length} chars');
      if (mounted) {
        setState(() {
          _currentStreamingText = streamingText;
        });
        // Auto-scroll to bottom as text streams in
        _scrollToBottom();
      }
    });
    
    // Listen to messages updates from ChatService
    _messagesSubscription = _chatService.messagesStream.listen((messages) {
      print('ChatScreen: Received messages update: ${messages.length} messages');
      if (mounted) {
        setState(() {
          // Messages list updated, rebuild UI
        });
        // Auto-scroll when new messages are added
        _scrollToBottom();
      }
    });
  }

  /// Auto-scroll to bottom of chat
  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      // Add a small delay to ensure the UI has updated
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  Future<void> _sendUsageLogsIfConsented() async {
    try {
      final consent = await ConsentService.instance.getConsent();
      if (consent != null && consent['appUsage'] == true) {
        setState(() {
          _appUsageConsent = true;
        });
        final now = DateTime.now();
        final startOfDay = DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
        final endOfDay = now.millisecondsSinceEpoch;
        try {
          final usageStats = await AppUsageService.getAppUsageStats(startOfDay, endOfDay);
          if (usageStats.isNotEmpty) {
            await UsageService.instance.sendUsageLogs(usageStats);
            print('App usage logs sent to backend.');
          } else {
            print('No app usage stats to send.');
          }
        } catch (e) {
          print('Failed to get/send app usage stats: $e');
        }
      }
    } catch (e) {
      print('Error checking consent or sending usage logs: $e');
    }
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
    // Initialize chat service with WebSocket (only first time)
    await _chatService.initialize();
    
    // Try to load recent chat (like ChatGPT)
    final hasRecentChat = await _chatService.loadRecentChat();
    if (mounted) {
      setState(() {
        // UI will rebuild with loaded messages
      });
      // Check deletion eligibility for loaded messages
      _checkMessageDeletionEligibility();
    }
  }

  /// For refresh button - properly reinitialize connection
  Future<void> _refreshConnection() async {
    await _chatService.reinitialize();
    await _initializeChat();
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading) return;
    
    // Prevent rapid-fire double sends
    if (_isLoading) return;
    
    _controller.clear();
    setState(() {
      _isLoading = true;
    }
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
  if (_scrollController.hasClients) {
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }
});


    try {
      final aiResponse = await _chatService.sendMessage(text);
      if (mounted) {
        setState(() {
          // UI will rebuild and show updated messages from ChatService
        });
        
        // Auto-scroll to show new message
        _scrollToBottom();
        
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
      padding: EdgeInsets.only(
        left: 8.0,
        right: 8.0,
        bottom: MediaQuery.of(context).viewInsets.bottom > 0 ? 8.0 : 8.0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Input field
          Expanded(
            child: Container(
              constraints: const BoxConstraints(
                maxHeight: 120, // Limit max height for multiline
              ),
              child: TextField(
                controller: _controller,
                enabled: !_isLoading,
                decoration: InputDecoration(
                  hintText: "Type a message...",
                  filled: true,
                  fillColor: Colors.white,  // 👈 back to clean white
                  contentPadding: const EdgeInsets.symmetric(
                      vertical: 12, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: const BorderSide(
                        color: Color(0xFF3E6C42), width: 2),
                  ),
                ),
                minLines: 1,
                maxLines: 5,
                keyboardType: TextInputType.multiline,
                textInputAction: TextInputAction.newline,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Send button
          Container(
            decoration: BoxDecoration(
              color: Colors.green.shade700,
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


 /*@override
  Widget build(BuildContext context) {
    final messages = _chatService.messages;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          _chatService.currentChatTitle ?? 'AI Chat Assistant',
          style: const TextStyle(color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _refreshConnection,
          ),
          IconButton(
            icon: const Icon(Icons.add, color: Colors.white),
            onPressed: _startNewChat,
            tooltip: 'New Chat',
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (mounted) {
                Navigator.pushReplacementNamed(context, LoginScreen.route);
              }
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
          // Main chat area with gradient background
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  colors: [
                    Colors.green.shade700,
                    Colors.green.shade300,
                    Colors.limeAccent.shade400,
                  ],
                ),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 100), // Push down for AppBar
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
                            controller: _scrollController,
                            padding: const EdgeInsets.all(12),
                            itemCount: messages.length + (_chatService.isStreaming ? 1 : 0),
                            itemBuilder: (context, index) {
                              // Show regular messages
                              if (index < messages.length) {
                                final msg = messages[index];
                                final canDelete = _messageCanDelete[msg.id] ?? false;
                                
                                return ChatBubble(
                                  text: msg.text, 
                                  fromUser: msg.isFromUser,
                                  messageId: msg.id,
                                  canDelete: canDelete,
                                  onDelete: canDelete ? () => _deleteMessage(msg.id) : null,
                                );
                              }
                              
                              // Show streaming AI message
                              else if (_chatService.isStreaming) {
                                return ChatBubble(
                                  text: _currentStreamingText,
                                  fromUser: false,
                                  messageId: 'streaming',
                                  canDelete: false,
                                  isStreaming: _currentStreamingText.isNotEmpty,
                                  isTyping: _currentStreamingText.isEmpty,
                                );
                              }
                              
                              return const SizedBox.shrink();
                            },
                          ),
                  ),
                  if (_isLoading)
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: AIThinkingIndicator(
                        message: 'AI is thinking...',
                        dotColor: Color(0xFF3E6C42),
                      ),
                    ),

                _buildChatInputBar(),



                ],
              ),
            ),
          ),
          // Input area outside the gradient
          //_buildChatInputBar(),
        ],
      ),
    );  // Close the Scaffold
  }*/

  @override
Widget build(BuildContext context) {
  final messages = _chatService.messages;

  return Scaffold(
    resizeToAvoidBottomInset: true,
    extendBodyBehindAppBar: true,
    appBar: AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      title: Text(
        _chatService.currentChatTitle ?? 'AI Chat Assistant',
        style: const TextStyle(color: Colors.white),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: Colors.white),
          onPressed: _refreshConnection,
        ),
        IconButton(
          icon: const Icon(Icons.add, color: Colors.white),
          onPressed: _startNewChat,
          tooltip: 'New Chat',
        ),
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.white),
          onPressed: () async {
            await AuthService.instance.signOut();
            if (mounted) {
              Navigator.pushReplacementNamed(context, LoginScreen.route);
            }
          },
        ),
      ],
    ),
    drawer: ChatHistoryDrawer(
      onChatSelected: _switchToChat,
      onNewChat: _startNewChat,
      onChatDeleted: _onChatDeleted,
    ),
    body: Stack(
  children: [
    // Gradient background
    Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          colors: [
            Colors.green.shade700,
            Colors.green.shade300,
            Colors.limeAccent.shade400,
          ],
        ),
      ),
    ),

    // Messages list
    Positioned.fill(
      top: 100, // offset for transparent AppBar
      child: ListView.builder(
        controller: _scrollController,
        padding: EdgeInsets.only(
          left: 12,
          right: 12,
          bottom: MediaQuery.of(context).viewInsets.bottom + 80, // input bar + safe area
          top: 12,
        ),
        itemCount: messages.length + (_chatService.isStreaming ? 1 : 0),
        itemBuilder: (context, index) {
          if (index < messages.length) {
            final msg = messages[index];
            final canDelete = _messageCanDelete[msg.id] ?? false;
            return ChatBubble(
              text: msg.text,
              fromUser: msg.isFromUser,
              messageId: msg.id,
              canDelete: canDelete,
              onDelete: canDelete ? () => _deleteMessage(msg.id) : null,
            );
          } else if (_chatService.isStreaming) {
            return ChatBubble(
              text: _currentStreamingText,
              fromUser: false,
              messageId: 'streaming',
              canDelete: false,
              isStreaming: _currentStreamingText.isNotEmpty,
              isTyping: _currentStreamingText.isEmpty,
            );
          }
          return const SizedBox.shrink();
        },
      ),
    ),

    // AI thinking indicator (above input bar)
    if (_isLoading)
      Positioned(
        left: 12,
        right: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 70, // above input
        child: const AIThinkingIndicator(
          message: 'AI is thinking...',
          dotColor: Color(0xFF3E6C42),
        ),
      ),

    // Input bar pinned
    Align(
      alignment: Alignment.bottomCenter,
      child: _buildChatInputBar(),
    ),
  ],
)

  );
}


  @override
  void dispose() {
    print('ChatScreen: Disposing and cleaning up subscriptions');
    _controller.dispose();
    _scrollController.dispose();
    
    // Cancel stream subscriptions to prevent memory leaks
    _streamingMessageSubscription?.cancel();
    _messagesSubscription?.cancel();
    
    // Don't disconnect WebSocket here as it's shared across screens
    // It will be properly managed by the service lifecycle
    super.dispose();
  }

}