// chatbot_profile.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import 'chat_screen.dart';
import 'login_screen.dart';
import 'dart:ui'; // For ImageFilter
import 'package:google_fonts/google_fonts.dart';


//
class ChatbotProfileScreen extends StatefulWidget {
  static const route = '/chatbot_profile';
  const ChatbotProfileScreen({super.key});

  @override
  State<ChatbotProfileScreen> createState() => _ChatbotProfileScreenState();
}

class _ChatbotProfileScreenState extends State<ChatbotProfileScreen> {
  String? _selectedGender;
  final List<String> _selectedPurposes = [];
  bool _loading = false;

 final List<Map<String, String>> genders = [
  {"apiValue": "Male", "display": "Jojo", "avatar": "assets/male.jpg"},
  {"apiValue": "Female", "display": "Gini", "avatar": "assets/female.jpg"},
];


  final List<Map<String, dynamic>> purposes = [
    {"label": "Friend", "icon": Icons.people_alt_outlined},
    {"label": "Partner", "icon": Icons.favorite_outline},
    {"label": "Therapist", "icon": Icons.psychology_outlined},
    {"label": "Mentor", "icon": Icons.school_outlined},
    {"label": "Study Buddy", "icon": Icons.menu_book_outlined},
  ];

  Future<void> _saveProfile() async {
    setState(() => _loading = true);
    const serverUrl = "http://192.168.1.2:8000";
    final url = Uri.parse("$serverUrl/api/v1/chatbot");

    final body = {"gender": _selectedGender, "purposes": _selectedPurposes};
    final headers = {"Content-Type": "application/json"};

    try {
      final authHeader = ApiService.instance.headers['Authorization'];
      if (authHeader != null) headers["Authorization"] = authHeader;
    } catch (_) {}

    try {
      final response =
          await http.post(url, headers: headers, body: jsonEncode(body));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, ChatScreen.route);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Failed: ${response.body}")),
        );
      }
    } catch (err) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text("Error: $err")));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _glassCard({
    required IconData icon,
    required String title,
    required bool selected,
    required VoidCallback onTap,
  }) {
     return GestureDetector(
    onTap: onTap,
    child: ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
          color: selected
              ? Colors.lightGreenAccent.withOpacity(0.3)
              : Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? Colors.lightGreenAccent
                : Colors.white.withOpacity(0.3),
            width: selected ? 2 : 1,
          ),
        ),

          child: Row(
            children: [
              Icon(icon, size: 26, color: Colors.white),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
              ),
              Icon(
                selected ? Icons.check_circle : Icons.arrow_forward_ios,
                color: Colors.white,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    ),
  );
  }

 @override
Widget build(BuildContext context) {
  return Scaffold(
    extendBodyBehindAppBar: true,
    appBar: AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () {
          Navigator.pushReplacementNamed(context, LoginScreen.route);
        },
      ),
    ),
    body: Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF388E3C), Color(0xFFE6EE9C)], // dark → light green
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Heading
            Text(
              "Set up your Sathi",
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge!.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 30),

            // Gender Section
            Text(
              "Select your Sathi to chat with",
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                    color: Colors.white70,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: genders.map((g) {
                final isSelected = _selectedGender == g["apiValue"];
                return GestureDetector(
                  onTap: () => setState(() => _selectedGender = g["apiValue"]),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: isSelected
                              ? const LinearGradient(
                                  colors: [Colors.green, Colors.lightGreen],
                                )
                              : null,
                          border: Border.all(
                            color: isSelected
                                ? Colors.white
                                : Colors.white.withOpacity(0.5),
                            width: 2,
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 45,
                          backgroundImage: AssetImage(g["avatar"]!),
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: isSelected
                              ? Container(
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.lightGreenAccent, width: 4),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.lightGreenAccent.withOpacity(0.6),
                                        blurRadius: 10,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        g["display"]!,
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 40),

            // Purpose Section
            Text(
              "How do you plan to use the app?",
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                    color: Colors.white70,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),

            Column(
              children: purposes.map((p) {
                final isSelected = _selectedPurposes.contains(p["label"]);
                return _glassCard(
                  icon: p["icon"],
                  title: p["label"],
                  selected: isSelected,
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedPurposes.remove(p["label"]);
                      } else {
                        _selectedPurposes.add(p["label"]);
                      }
                    });
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 40),

            // Continue Button
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 6,
                ).copyWith(
                  backgroundColor: MaterialStateProperty.all(Colors.transparent),
                  shadowColor: MaterialStateProperty.all(Colors.transparent),
                ),
                onPressed: _loading
                    ? null
                    : () {
                        if (_selectedGender == null ||
                            _selectedPurposes.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text("Please select options")),
                          );
                          return;
                        }
                        _saveProfile();
                      },
                child: Ink(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2E7D32), Color(0xFF66BB6A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Center(
                    child: _loading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            "Continue",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

}
