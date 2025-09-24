import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'consent_screen.dart';
import 'login_screen.dart';

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
  final _confirmPassword = TextEditingController();

  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

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

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    IconData? icon,
    String? Function(String?)? validator,
    bool obscure = false,
    VoidCallback? toggleObscure, // 👈 added for toggle
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: TextFormField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboardType,
        validator: validator,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          prefixIcon:
              icon != null ? Icon(icon, color: Colors.grey.shade400, size: 17) : null,
          suffixIcon: toggleObscure != null
              ? IconButton(
                  icon: Icon(
                    obscure ? Icons.visibility_off : Icons.visibility,
                    color: Colors.grey,
                    size: 18,
                  ),
                  onPressed: toggleObscure,
                )
              : null,
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
          border: const UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.grey),
          ),
          focusedBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.green, width: 2),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    // Dispose all text controllers to prevent memory leaks
    _name.dispose();
    _enrollment.dispose();
    _batch.dispose();
    _course.dispose();
    _country.dispose();
    _email.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            Navigator.pushReplacementNamed(context, LoginScreen.route);
          },
        ),
      ),
      extendBodyBehindAppBar: true,
      body: Container(
        width: double.infinity,
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const SizedBox(height: 100),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text("Register",
                  style: TextStyle(color: Colors.white, fontSize: 40)),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text("Create your account",
                  style: TextStyle(color: Colors.white, fontSize: 18)),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(60),
                    topRight: Radius.circular(60),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(30),
                  child: SingleChildScrollView(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          const SizedBox(height: 40),

                          _buildTextField(
                              controller: _name,
                              hint: "Name",
                              icon: Icons.person),
                          _buildTextField(
                              controller: _enrollment,
                              hint: "Enrollment Number",
                              icon: Icons.badge,
                              validator: (v) =>
                                  v!.isNotEmpty ? null : 'Enter your enrollment number'),
                          _buildTextField(
                              controller: _batch,
                              hint: "Batch",
                              icon: Icons.group,
                              validator: (v) =>
                                  v!.isNotEmpty ? null : 'Enter your batch'),
                          _buildTextField(
                              controller: _course,
                              hint: "Course",
                              icon: Icons.school,
                              validator: (v) =>
                                  v!.isNotEmpty ? null : 'Enter your course'),
                          _buildTextField(
                              controller: _email,
                              hint: "Email",
                              icon: Icons.email,
                              keyboardType: TextInputType.emailAddress,
                              validator: (v) =>
                                  v!.contains('@') ? null : 'Enter valid email'),

                          // Password with toggle
                          _buildTextField(
                            controller: _password,
                            hint: "Password",
                            icon: Icons.lock,
                            obscure: _obscurePassword,
                            toggleObscure: () {
                              setState(() => _obscurePassword = !_obscurePassword);
                            },
                            validator: (v) =>
                                v!.length >= 10 ? null : 'Min 10 characters required',
                          ),

                          // Confirm Password with check
                          _buildTextField(
                            controller: _confirmPassword,
                            hint: "Confirm Password",
                            icon: Icons.lock_outline,
                            obscure: _obscureConfirmPassword,
                            toggleObscure: () {
                              setState(() =>
                                  _obscureConfirmPassword = !_obscureConfirmPassword);
                            },
                            validator: (v) =>
                                v == _password.text ? null : 'Passwords do not match',
                          ),

                          const SizedBox(height: 30),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _loading ? null : _register,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(50),
                                ),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: _loading
                                  ? const CircularProgressIndicator(
                                      valueColor:
                                          AlwaysStoppedAnimation<Color>(Colors.white))
                                  : const Text("Register",
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold)),
                            ),
                          ),

                          const SizedBox(height: 20),
                          TextButton(
                            onPressed: () => Navigator.pushReplacementNamed(
                                context, LoginScreen.route),
                            child: const Text(
                              'Have an account? Login',
                              style: TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
