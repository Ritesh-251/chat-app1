// lib/services/usage_service.dart
import 'dart:convert';
import 'package:usage_stats/usage_stats.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class UsageService {
  UsageService._();
  static final instance = UsageService._();

  Future<List<Map<String, dynamic>>> collectUsage() async {
    DateTime endDate = DateTime.now();
    DateTime startDate = endDate.subtract(const Duration(hours: 24));

    // Ask permission if not granted
    bool granted = await UsageStats.checkUsagePermission();
    if (!granted) {
      await UsageStats.grantUsagePermission();
      granted = await UsageStats.checkUsagePermission();
      if (!granted) {
        throw Exception("Usage access not granted by user");
      }
    }

    List<UsageInfo> usageInfo =
        await UsageStats.queryUsageStats(startDate, endDate);

    return usageInfo.map((u) {
      return {
        "packageName": u.packageName,
        "totalTimeInForeground": u.totalTimeInForeground,
        "lastTimeUsed": DateTime.fromMillisecondsSinceEpoch(
          int.tryParse(u.lastTimeUsed ?? '0') ?? 0,
        ).toIso8601String(),
      };
    }).toList();
  }

  Future<bool> sendUsageLogs() async {
    final usageLogs = await collectUsage();

    if (usageLogs.isEmpty) return false;

    final url = "${ApiService.baseUrl}/api/v1/user/usage";
    final response = await http.post(
      Uri.parse(url),
      headers: ApiService.instance.headers,
      body: jsonEncode(usageLogs), // backend expects array
    );

    if (response.statusCode == 201) {
      print("Usage logs sent successfully");
      return true;
    } else {
      print("Failed to send usage logs: ${response.body}");
      return false;
    }
  }
}
