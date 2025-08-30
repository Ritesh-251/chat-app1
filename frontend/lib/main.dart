import 'package:flutter/material.dart';

import 'screens/start_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/consent_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // await Firebase.initializeApp(); // Uncomment if using Firebase
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Chatbot App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E7D32)),
        useMaterial3: true,
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(14)),
          ),
        ),
      ),
      initialRoute: StartScreen.route,
      routes: {
        StartScreen.route: (_) => const StartScreen(),
        LoginScreen.route: (_) => const LoginScreen(),
        ConsentScreen.route: (_) => ConsentScreen(),
        RegisterScreen.route: (_) => const RegisterScreen(),
        ChatScreen.route: (_) => const ChatScreen(),
      },
    );
  }
}
