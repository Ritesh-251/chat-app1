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

class _ConsentScreenState extends State<ConsentScreen> with WidgetsBindingObserver {
  bool conversationLogs = false;
  bool appUsage = false;
  bool audio = false;

  bool _waitingForUsagePermission = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Consent will only be loaded when explicitly requested
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (_waitingForUsagePermission && state == AppLifecycleState.resumed) {
      // Check permission again after returning from settings
      bool hasPermission = false;
      try {
        hasPermission = await AppUsageService.hasUsagePermission();
      } catch (e) {
        print('Error checking usage permission on resume: $e');
      }
      if (hasPermission) {
        // Permission granted, fetch and send usage logs
        try {
          final now = DateTime.now();
          final startOfDay = DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
          final endOfDay = now.millisecondsSinceEpoch;
          final usageStats = await AppUsageService.getAppUsageStats(startOfDay, endOfDay);
          await UsageService.instance.sendUsageLogs(usageStats);
          print('Usage logs sent after permission granted.');
        } catch (e) {
          print('Failed to send usage logs after permission granted: $e');
        }
        _waitingForUsagePermission = false;
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/chat');
        }
      }
    }
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

    if (appUsage) {
      bool hasPermission = false;
      try {
        hasPermission = await AppUsageService.hasUsagePermission();
      } catch (e) {
        print('Error checking usage permission: $e');
      }
      if (!hasPermission) {
        // Show dialog and open settings
        if (mounted) {
          await showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: Text('Permission Required'),
              content: Text('Please grant Usage Access permission to track app usage.'),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _waitingForUsagePermission = true;
                    AppUsageService.openUsageSettings();
                  },
                  child: Text('Open Settings'),
                ),
              ],
            ),
          );
        }
        // Do not navigate yet; will navigate after permission is granted
        return;
      } else {
        // Permission granted, fetch and send usage logs
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
