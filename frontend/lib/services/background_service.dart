import 'package:shared_preferences/shared_preferences.dart';
import 'auth_service.dart';

class BackgroundService {
  static bool _isInitialized = false;

  /// Initialize background service
  static Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Set app status as active
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_status', 'active');
      await prefs.setString('last_activity', DateTime.now().toIso8601String());
      
      print('[BackgroundService] Initialized successfully');
      _isInitialized = true;
    } catch (e) {
      print('[BackgroundService] Initialization error: $e');
    }
  }

  /// Update app status when backgrounded
  static Future<void> onAppPaused() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_status', 'backgrounded');
      await prefs.setString('last_background_time', DateTime.now().toIso8601String());
      
      print('[BackgroundService] App moved to background');
    } catch (e) {
      print('[BackgroundService] Error updating background status: $e');
    }
  }

  /// Update app status when resumed
  static Future<void> onAppResumed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_status', 'active');
      await prefs.setString('last_resume_time', DateTime.now().toIso8601String());
      
      // Restore authentication state if needed
      if (AuthService.instance.currentUser == null) {
        await AuthService.instance.initialize();
        print('[BackgroundService] Authentication state restored on resume');
      } else {
        // Validate existing session
        await AuthService.instance.validateSession();
        print('[BackgroundService] Authentication session validated on resume');
      }
      
      print('[BackgroundService] App resumed from background');
    } catch (e) {
      print('[BackgroundService] Error updating resume status: $e');
    }
  }

  /// Perform periodic maintenance tasks
  static Future<void> performMaintenanceTasks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('last_maintenance', DateTime.now().toIso8601String());
      
      // Add your maintenance tasks here:
      // - Sync data with server
      // - Clean up temporary files
      // - Update local cache
      
      print('[BackgroundService] Maintenance tasks completed');
    } catch (e) {
      print('[BackgroundService] Maintenance error: $e');
    }
  }

  /// Get app background duration
  static Future<Duration?> getBackgroundDuration() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final backgroundTimeStr = prefs.getString('last_background_time');
      final resumeTimeStr = prefs.getString('last_resume_time');
      
      if (backgroundTimeStr != null && resumeTimeStr != null) {
        final backgroundTime = DateTime.parse(backgroundTimeStr);
        final resumeTime = DateTime.parse(resumeTimeStr);
        return resumeTime.difference(backgroundTime);
      }
    } catch (e) {
      print('[BackgroundService] Error calculating background duration: $e');
    }
    return null;
  }

  /// Stop background service
  static Future<void> stop() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_status', 'stopped');
      _isInitialized = false;
      print('[BackgroundService] Stopped successfully');
    } catch (e) {
      print('[BackgroundService] Stop error: $e');
    }
  }

  /// Check if service is initialized
  static bool get isInitialized => _isInitialized;
}