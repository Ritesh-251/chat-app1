import 'package:shared_preferences/shared_preferences.dart';

class ConsentManager {
  static const _key = 'user_app_usage_consent';
  static const _backgroundKey = 'background_execution_consent';

  static Future<void> setAppUsageConsent(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, value);
  }

  static Future<bool> getAppUsageConsent() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_key) ?? false;
  }

  static Future<void> setBackgroundExecutionConsent(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_backgroundKey, value);
  }

  static Future<bool> getBackgroundExecutionConsent() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_backgroundKey) ?? true; // Default to true for background execution
  }
}
