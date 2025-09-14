import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/consent_service.dart'; // 👈 add this
import '../widgets/primary_button.dart';
import '../widgets/text_field.dart';
import 'chat_screen.dart';
import 'register_screen.dart';
import 'consent_screen.dart'; // 👈 import ConsentScreen

class LoginScreen extends StatefulWidget {
  static const route = '/login';
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final result = await AuthService.instance.signIn(
        _email.text.trim(),
        _password.text.trim(),
      );

      if (mounted) {
        if (result['success'] == true) {
            // Only check consent if token is set and user is authenticated
            if (result['user'] != null && ApiService.instance.headers['Authorization'] != null) {
              final consent = await ConsentService.instance.getConsent();
              if (consent != null) {
                Navigator.pushReplacementNamed(context, ChatScreen.route);
              } else {
                Navigator.pushReplacementNamed(context, ConsentScreen.route);
              }
            }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Login failed')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              LabeledField(
                label: 'Email',
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                validator: (v) => v!.contains('@') ? null : 'Enter valid email',
              ),
              const SizedBox(height: 16),
              LabeledField(
                label: 'Password',
                controller: _password,
                obscure: true,
                validator: (v) => v!.length >= 6 ? null : 'Min 6 chars',
              ),
              const SizedBox(height: 9),
              PrimaryButton(label: 'Login', onPressed: _login, loading: _loading),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.pushReplacementNamed(context, RegisterScreen.route),
                child: const Text('No account? Register'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
