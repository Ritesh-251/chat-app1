import 'package:flutter/material.dart';

class ConsentScreen extends StatefulWidget {
  final String researchId;
  const ConsentScreen({super.key, required this.researchId});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool audioOptIn = false;

  vvoid _acceptConsent() async {
  final success = await ConsentService.instance.sendConsent(
    researchId: widget.researchId,
    conversationLogs: true,
    appUsage: true,
    audio: audioOptIn,
  );

  if (success) {
    Navigator.pushReplacementNamed(context, "/start");
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Failed to save consent. Try again.")),
    );
  }
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FBF5), // Cream background
      appBar: AppBar(
        title: const Text("Consent"),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF2D3748)), // Dark gray
        titleTextStyle: const TextStyle(
          color: Color(0xFF2D3748),
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "We respect your privacy",
              style: TextStyle(
                color: Color(0xFF2D3748),
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            // Required items
            _infoTile(
              title: "Conversation Logs",
              description:
                  "We record your chat with the AI (messages + time) to improve study support. "
                  "Your name or email is never stored with chats.",
              required: true,
            ),
            _infoTile(
              title: "App Usage",
              description:
                  "We collect which apps you use, when, and for how long. "
                  "This helps us study learning habits. Content of apps is never recorded.",
              required: true,
            ),

            // Optional item
            SwitchListTile(
              title: const Text(
                "Allow Audio Stats (Optional)",
                style: TextStyle(
                  color: Color(0xFF2D3748),
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: const Text(
                "If enabled, we analyze short background sound levels (like noise). "
                "No raw audio leaves your device.",
                style: TextStyle(color: Colors.grey),
              ),
              value: audioOptIn,
              onChanged: (val) => setState(() => audioOptIn = val),
              activeColor: Colors.red.shade600,
            ),

            const Spacer(),

            // Accept button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _acceptConsent,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D3748), // Dark gray
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  "Accept & Continue",
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Decline note
            Center(
              child: Text(
                "You can change consent anytime in Settings",
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoTile({required String title, required String description, required bool required}) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lock, size: 18, color: required ? Colors.red.shade600 : Colors.grey.shade600),
              const SizedBox(width: 6),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2D3748),
                ),
              ),
              if (required)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    "Required",
                    style: TextStyle(
                      color: Colors.red.shade600,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
