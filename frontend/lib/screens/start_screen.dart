import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'chat_screen.dart';
import 'login_screen.dart';

class StartScreen extends StatefulWidget {
  static const route = '/';
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  @override
  void initState() {
    super.initState();
    // Listen once; if logged in, jump to chat.
    AuthService.instance.authChanges.listen((user) {
      if (mounted && user != null) {
        Navigator.pushReplacementNamed(context, ChatScreen.route);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Spacer(),
            const Icon(Icons.chat_bubble_outline, size: 96),
            const SizedBox(height: 16),
            Text('My Chatbot', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('Welcome! Sign in to start chatting.', style: Theme.of(context).textTheme.bodyMedium),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton(
                onPressed: () => Navigator.pushReplacementNamed(context, LoginScreen.route),
                child: const Text('Get Started'),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}