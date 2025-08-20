import 'package:flutter/material.dart';

class ChatBubble extends StatelessWidget {
  final String text;
  final bool fromUser;
  const ChatBubble({super.key, required this.text, required this.fromUser});

  @override
  Widget build(BuildContext context) {
    final bg = fromUser ? Theme.of(context).colorScheme.primary : Colors.grey.shade200;
    final fg = fromUser ? Colors.white : Colors.black87;
    final align = fromUser ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final radius = BorderRadius.only(
      topLeft: const Radius.circular(16),
      topRight: const Radius.circular(16),
      bottomLeft: fromUser ? const Radius.circular(16) : const Radius.circular(0),
      bottomRight: fromUser ? const Radius.circular(0) : const Radius.circular(16),
    );

    return Column(
      crossAxisAlignment: align,
      children: [
        Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(color: bg, borderRadius: radius),
          child: Text(text, style: TextStyle(color: fg)),
        )
      ],
    );
  }
}