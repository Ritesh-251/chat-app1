import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class UsageService {
  UsageService._();
  static final instance = UsageService._();

  Future<bool> sendUsageLogs(List<Map<String, dynamic>> logs) async {
  final url = '${ApiService.baseUrl}/api/v1/usage/';
  
  // Normalize logs
  final normalizedLogs = logs.map((log) {
    return {
      "package": log["package"] ?? log["packageName"] ?? "unknown",
      "timeUsed": log["timeUsed"] ?? log["totalTimeInForeground"] ?? 0,
      "startTime": log["startTime"] != null
          ? log["startTime"]
          : (log["lastTimeUsed"] != null && log["lastTimeUsed"] != 0
              ? DateTime.fromMillisecondsSinceEpoch(log["lastTimeUsed"]).toIso8601String()
              : DateTime.now().toIso8601String()),
      "endTime": log["endTime"] ??
          DateTime.now().toIso8601String(),
    };
  }).toList();

  print('[USAGE] Sending usage logs to: $url');
  print('[USAGE] Logs: ${jsonEncode(normalizedLogs)}');

  try {
    final response = await http.post(
      Uri.parse(url),
      headers: ApiService.instance.headers,
      body: jsonEncode(normalizedLogs),
    );

    print('[USAGE] Response status: ${response.statusCode}');
    print('[USAGE] Response body: ${response.body}');

    return response.statusCode == 201;
  } catch (e) {
    print('[USAGE] Failed to send logs: $e');
    return false;
  }
}
}
