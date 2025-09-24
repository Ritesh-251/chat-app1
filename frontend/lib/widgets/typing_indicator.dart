import 'package:flutter/material.dart';

class TypingIndicator extends StatefulWidget {
  final Color color;
  final double size;
  final Duration animationDuration;

  const TypingIndicator({
    super.key,
    this.color = Colors.grey,
    this.size = 8.0,
    this.animationDuration = const Duration(milliseconds: 1400),
  });

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with TickerProviderStateMixin {
  late List<AnimationController> _animationControllers;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _initAnimations();
  }

  void _initAnimations() {
    _animationControllers = List.generate(
      3,
      (index) => AnimationController(
        duration: widget.animationDuration,
        vsync: this,
      ),
    );

    _animations = _animationControllers.map((controller) {
      return Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: controller,
          curve: const Interval(0.0, 0.5, curve: Curves.easeInOut),
        ),
      );
    }).toList();

    // Start animations with delays
    for (int i = 0; i < _animationControllers.length; i++) {
      Future.delayed(Duration(milliseconds: i * 160), () {
        if (mounted) {
          _animationControllers[i].repeat(reverse: true);
        }
      });
    }
  }

  @override
  void dispose() {
    for (var controller in _animationControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _animations[index],
          builder: (context, child) {
            return Container(
              margin: EdgeInsets.only(
                right: index < 2 ? 4.0 : 0,
              ),
              child: Transform.translate(
                offset: Offset(0, -_animations[index].value * 8),
                child: Container(
                  width: widget.size,
                  height: widget.size,
                  decoration: BoxDecoration(
                    color: widget.color.withOpacity(0.4 + _animations[index].value * 0.6),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          },
        );
      }),
    );
  }
}

// Professional AI Thinking Widget
class AIThinkingIndicator extends StatelessWidget {
  final String message;
  final TextStyle? textStyle;
  final Color dotColor;

  const AIThinkingIndicator({
    super.key,
    this.message = 'AI is thinking',
    this.textStyle,
    this.dotColor = Colors.grey,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        TypingIndicator(color: dotColor, size: 6.0),
        const SizedBox(width: 8),
        Text(
          message,
          style: textStyle ?? 
            TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
        ),
      ],
    );
  }
}

// Simple typing dots for chat bubbles
class ChatTypingDots extends StatelessWidget {
  final Color color;

  const ChatTypingDots({
    super.key,
    this.color = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: TypingIndicator(
        color: color,
        size: 8.0,
      ),
    );
  }
}