import 'package:flutter/services.dart';

class AppUsageService {
  static const MethodChannel _channel = MethodChannel('app.usage.channel');

  static Future<List<Map<String, dynamic>>> getAppUsageStats(int start, int end) async {
    final List<dynamic> result = await _channel.invokeMethod('getUsageStats', {
      'start': start,
      'end': end,
    });
    return result.cast<Map<String, dynamic>>();
  }

  static Future<void> openUsageSettings() async {
    await _channel.invokeMethod('openUsageSettings');
  }
}
