/*import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/consent_service.dart';
import 'chat_screen.dart';
import 'consent_screen.dart';
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
    
    // Check for existing authentication immediately
    _checkExistingAuth();
    
    // Listen for auth changes
    AuthService.instance.authChanges.listen((user) async {
      if (mounted && user != null) {
        final consent = await ConsentService.instance.getConsent();
        if (consent != null) {
          Navigator.pushReplacementNamed(context, ChatScreen.route);
        } else {
          Navigator.pushReplacementNamed(context, ConsentScreen.route);
        }
      }
    });
  }

  Future<void> _checkExistingAuth() async {
    // Small delay to ensure auth service initialization is complete
    await Future.delayed(const Duration(milliseconds: 100));
    
    final currentUser = AuthService.instance.currentUser;
    if (mounted && currentUser != null) {
      final consent = await ConsentService.instance.getConsent();
      if (consent != null) {
        Navigator.pushReplacementNamed(context, ChatScreen.route);
      } else {
        Navigator.pushReplacementNamed(context, ConsentScreen.route);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Spacer(),
            const Icon(Icons.chat_bubble_outline, size: 96),
            const SizedBox(height: 16),
            Text('AIBuddy', style: Theme.of(context).textTheme.headlineMedium),
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
}*/

import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/consent_service.dart';
import 'chat_screen.dart';
import 'consent_screen.dart';
import 'login_screen.dart';
import 'dart:ui'; 


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
    _initFlow();
  }

  Future<void> _initFlow() async {
   
    await Future.delayed(const Duration(seconds: 5));

    final user = AuthService.instance.currentUser; // 👈 directly check current user

    if (!mounted) return;

    if (user != null) {
      final consent = await ConsentService.instance.getConsent();
      if (!mounted) return;
      if (consent != null) {
        Navigator.pushReplacementNamed(context, ChatScreen.route);
      } else {
        Navigator.pushReplacementNamed(context, ConsentScreen.route);
      }
    } else {
      Navigator.pushReplacementNamed(context, LoginScreen.route);
    }
  }

@override
Widget build(BuildContext context) {
  return Scaffold(
    body: Stack(
      fit: StackFit.expand,
      children: [
        // Background image
        Image.asset(
          "assets/splscreen.png",
          fit: BoxFit.cover,
        ),

        // Blurry translucent overlay
        Container(
          color: Colors.white.withOpacity(0.3),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.white.withOpacity(0.2)),
          ),
        ),

        // Foreground content
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App name
                Text(
                  "Sathi",
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                        letterSpacing: 1.2,
                      ),
                ),

                const SizedBox(height: 12),

                // Tagline
                Text(
                  "Your friend, partner, therapist, mentor and study buddy",
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontSize: 16,
                        fontWeight: FontWeight.w400,
                        color: Colors.black54,
                      ),
                ),

                const SizedBox(height: 40),

                // Linear progress loader
                SizedBox(
                  width: 200,
                  child: TweenAnimationBuilder<double>(
                    duration: const Duration(seconds: 3),
                    curve: Curves.easeInOut,
                    tween: Tween(begin: 0.0, end: 1.0),
                    builder: (context, value, _) {
                      return LinearProgressIndicator(
                        value: value,
                        minHeight: 6,
                        borderRadius: BorderRadius.circular(12),
                        backgroundColor: Colors.black12,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          Colors.green,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}


}
