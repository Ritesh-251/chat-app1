import '../services/consent_service.dart';
import '../services/app_usage_service.dart';
import '../services/usage_service.dart';
import 'package:flutter/material.dart';

class ConsentScreen extends StatefulWidget {
  static const route = '/consent';

  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool conversationLogs = false;
  bool appUsage = false;
  bool audio = false;

  @override
  void initState() {
    super.initState();
    // Consent will only be loaded when explicitly requested
  }

  Future<void> _loadConsent() async {
    try {
      final consent = await ConsentService.instance.getConsent();
      if (consent != null) {
        setState(() {
          conversationLogs = consent['conversationLogs'] ?? false;
          appUsage = consent['appUsage'] ?? false;
          audio = consent['audio'] ?? false;
        });
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> _submitConsent() async {
    await ConsentService.instance.sendConsent(
      conversationLogs: conversationLogs,
      appUsage: appUsage,
      audio: audio,
    );
    print('Consent values: conversationLogs=$conversationLogs, appUsage=$appUsage, audio=$audio');

    // If user consented to app usage, fetch and send usage logs
    if (appUsage) {
      try {
        final now = DateTime.now();
        final startOfDay = DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
        final endOfDay = now.millisecondsSinceEpoch;
        final usageStats = await AppUsageService.getAppUsageStats(startOfDay, endOfDay);
        await UsageService.instance.sendUsageLogs(usageStats);
      } catch (e) {
        print('Failed to send usage logs: $e');
      }
    }
    Navigator.pushReplacementNamed(context, '/chat');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Consent')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            const Text(
              'Please provide your consent for the following:',
              style: TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 20),
            SwitchListTile(
              title: const Text('Conversation Logs'),
              value: conversationLogs,
              onChanged: (val) => setState(() => conversationLogs = val),
            ),
            SwitchListTile(
              title: const Text('App Usage Tracking'),
              value: appUsage,
              onChanged: (val) => setState(() => appUsage = val),
            ),
            SwitchListTile(
              title: const Text('Audio Recording'),
              value: audio,
              onChanged: (val) => setState(() => audio = val),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: _submitConsent,
              child: const Text('Submit Consent'),
            ),
          ],
        ),
      ),
    );
  }
}
