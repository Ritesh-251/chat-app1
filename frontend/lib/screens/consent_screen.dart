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

class _ConsentScreenState extends State<ConsentScreen>
    with WidgetsBindingObserver {
  bool conversationLogs = false;
  bool appUsage = false;
  bool audio = false;

  bool _waitingForUsagePermission = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadConsent();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  List<Map<String, dynamic>> _formatUsageLogs(List<dynamic> usageStats) {
    return usageStats.map((rawLog) {
      final raw = rawLog as Map<Object?, Object?>;
      final packageName = raw['packageName']?.toString() ?? 'unknown';
      final lastTimeUsed = (raw['lastTimeUsed'] as int?) ?? 0;
      final totalTime = (raw['totalTimeInForeground'] as int?) ?? 0;

      // Skip logs with no meaningful usage
      if (lastTimeUsed == 0 || totalTime <= 0) return null;

      final endTime = DateTime.fromMillisecondsSinceEpoch(lastTimeUsed);
      final startTime = endTime.subtract(Duration(milliseconds: totalTime));

      return {
        'package': packageName,
        'timeUsed': totalTime,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime.toIso8601String(),
      };
    })
    .where((log) => log != null)
    .cast<Map<String, dynamic>>()
    .toList();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (_waitingForUsagePermission && state == AppLifecycleState.resumed) {
      bool hasPermission = await AppUsageService.hasUsagePermission();
      if (hasPermission) {
        await _sendUsageLogs();
        _waitingForUsagePermission = false;
        if (mounted) Navigator.pushReplacementNamed(context, '/chat');
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
      print("Error loading consent: $e");
    }
  }

  Future<void> _sendUsageLogs() async {
    try {
      final now = DateTime.now();
      final startOfDay =
          DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
      final endOfDay = now.millisecondsSinceEpoch;

      final usageStats =
          await AppUsageService.getAppUsageStats(startOfDay, endOfDay);
      final logs = _formatUsageLogs(usageStats);

      if (logs.isEmpty) {
        print('No valid usage logs to send.');
        return;
      }

      await UsageService.instance.sendUsageLogs(logs); // ✅ headers included
      print('Usage logs sent successfully.');
    } catch (e) {
      print('Failed to send usage logs: $e');
    }
  }

  Future<void> _submitConsent() async {
    try {
      await ConsentService.instance.sendConsent(
        conversationLogs: conversationLogs,
        appUsage: appUsage,
        audio: audio,
      );

      print(
          'Consent values: conversationLogs=$conversationLogs, appUsage=$appUsage, audio=$audio');

      if (appUsage) {
        bool hasPermission = await AppUsageService.hasUsagePermission();
        if (!hasPermission) {
          if (mounted) {
            await showDialog(
              context: context,
              builder: (_) => AlertDialog(
                title: const Text('Permission Required'),
                content: const Text(
                    'Please grant Usage Access permission to track app usage.'),
                actions: [
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _waitingForUsagePermission = true;
                      AppUsageService.openUsageSettings();
                    },
                    child: const Text('Open Settings'),
                  ),
                ],
              ),
            );
          }
          return;
        } else {
          await _sendUsageLogs();
        }
      }

      if (mounted) Navigator.pushReplacementNamed(context, '/chat');
    } catch (e) {
      print('Error submitting consent: $e');
    }
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
