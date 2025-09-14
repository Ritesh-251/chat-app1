import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../widgets/primary_button.dart';
import '../widgets/text_field.dart';
import 'chat_screen.dart';
import 'consent_screen.dart';
import 'login_screen.dart';
import '../services/consent_service.dart';

class RegisterScreen extends StatefulWidget {
  static const route = '/register';
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  final _name = TextEditingController();
  final _enrollment = TextEditingController();
  final _batch = TextEditingController();
  final _course = TextEditingController();
  final _country = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  bool _loading = false;

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final result = await AuthService.instance.signUp(
        _name.text.trim(),
        _enrollment.text.trim(),
        _batch.text.trim(),
        _course.text.trim(),
        _country.text.trim(),
        _email.text.trim(),
        _password.text.trim(),
      );

      if (mounted) {
        if (result['success'] == true) {
          // After registration, always go to consent screen (no consent check)
          Navigator.pushReplacementNamed(context, ConsentScreen.route);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Registration failed')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration error: $e')),
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
      appBar: AppBar(title: const Text('Register')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              children: [
                LabeledField(
                  label: 'Name (Optional)',
                  controller: _name,
                  validator: null, // Name is optional
                ),
                const SizedBox(height: 16),
                LabeledField(
                  label: 'Enrollment Number',
                  controller: _enrollment,
                  validator: (v) =>
                      v!.isNotEmpty ? null : 'Enter your enrollment number',
                ),
                const SizedBox(height: 16),
                LabeledField(
                  label: 'Batch',
                  controller: _batch,
                  validator: (v) => v!.isNotEmpty ? null : 'Enter your batch',
                ),
                const SizedBox(height: 16),
                LabeledField(
                  label: 'Course',
                  controller: _course,
                  validator: (v) => v!.isNotEmpty ? null : 'Enter your course',
                ),
                const SizedBox(height: 16),
                LabeledField(
                  label: 'Country (Optional)',
                  controller: _country,
                  validator: null, // Country is optional
                ),
                const SizedBox(height: 16),
                LabeledField(
                  label: 'Email',
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) =>
                      v!.contains('@') ? null : 'Enter valid email',
                ),
                const SizedBox(height: 16),
                LabeledField(
                  label: 'Password',
                  controller: _password,
                  obscure: true,
                  validator: (v) =>
                      v!.length >= 10 ? null : 'Min 10 characters required',
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Register',
                  onPressed: _register,
                  loading: _loading,
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pushReplacementNamed(
                    context,
                    LoginScreen.route,
                  ),
                  child: const Text('Have an account? Login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
