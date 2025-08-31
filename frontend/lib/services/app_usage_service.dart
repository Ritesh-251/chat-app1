import 'package:flutter/services.dart';

class AppUsageService {
  static Future<bool> hasUsagePermission() async {
 try {
    final res = await _channel.invokeMethod('hasUsagePermission');
    return res == true;
  } catch (e) {
    print('hasUsagePermission error: $e');
    return false;
  }
  }
  static const MethodChannel _channel = MethodChannel('app.usage.channel');

  static Future<List<Map<String, dynamic>>> getAppUsageStats(int start, int end) async {
    try {
      final List<dynamic> result = await _channel.invokeMethod('getUsageStats', {
        'start': start,
        'end': end,
      });
      return result.cast<Map<String, dynamic>>();
    } catch (e) {
      print('getAppUsageStats error: $e');
      return [];
    }
  }
     

  static Future<void> openUsageSettings() async {
    await _channel.invokeMethod('openUsageSettings');
  }
}
