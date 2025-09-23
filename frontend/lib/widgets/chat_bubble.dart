import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class ChatBubble extends StatelessWidget {
  final String text;
  final bool fromUser;
  final String? messageId;
  final VoidCallback? onDelete;
  final bool canDelete;

  const ChatBubble({
    super.key,
    required this.text,
    required this.fromUser,
    this.messageId,
    this.onDelete,
    this.canDelete = false,
  });

  void _showDeleteOption(BuildContext context) {
    if (!canDelete || onDelete == null) return;
    _showDeletePopup(context);
  }

  void _showDeletePopup(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 280),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Delete Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.delete_outline,
                    color: Colors.red.shade600, size: 24),
              ),
              const SizedBox(height: 12),
              const Text(
                'Delete Message',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3748)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Are you sure you want to delete this message? This action cannot be undone.',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                  height: 1.3,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey.shade100,
                        foregroundColor: Colors.grey.shade700,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(color: Colors.grey.shade300),
                        ),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        onDelete?.call();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade600,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Delete'),
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

  @override
  Widget build(BuildContext context) {
    final align = fromUser ? CrossAxisAlignment.end : CrossAxisAlignment.start;

    final radius = BorderRadius.only(
      topLeft: const Radius.circular(16),
      topRight: const Radius.circular(16),
      bottomLeft: fromUser ? const Radius.circular(16) : const Radius.circular(0),
      bottomRight: fromUser ? const Radius.circular(0) : const Radius.circular(16),
    );

    // User message (gradient bubble)
    Widget bubble = Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      constraints: const BoxConstraints(maxWidth: 280),
      decoration: BoxDecoration(
        gradient: fromUser
            ? LinearGradient(
                colors: [
                  Colors.green.shade700,
                  Colors.green.shade700,
                  Colors.green.shade300,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: fromUser ? null : Colors.grey.shade200,
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 6,
            offset: const Offset(2, 2),
          )
        ],
      ),
      child: Text(
        text,
        style: TextStyle(
          color: fromUser ? Colors.white : Colors.black87,
          fontSize: 14,
        ),
      ),
    );

    if (fromUser && canDelete && onDelete != null) {
      bubble = GestureDetector(
        onLongPress: () => _showDeleteOption(context),
        onTap: kIsWeb ? () => _showDeleteOption(context) : null,
        child: bubble,
      );
    }

    return Column(crossAxisAlignment: align, children: [bubble]);
  }
}
