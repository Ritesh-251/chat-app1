import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_service.dart';

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  // Get token and send to backend
  static Future<void> initNotifications() async {
    // Request permission (iOS)
    await _firebaseMessaging.requestPermission();

    // Get FCM token
    String? token = await _firebaseMessaging.getToken();
    print("🔑 FCM Token: $token");

    // Send token to backend
    if (token != null) {
      await sendTokenToBackend(token);
    }
  }

  /// Send only the FCM token. Backend will use X-App-ID to select the DB.
  static Future<void> sendTokenToBackend(String token) async {
    final url = Uri.parse('${ApiService.baseUrl}/api/v1/notification');

    final headers = Map<String, String>.from(ApiService.instance.headers);
    headers['Content-Type'] = 'application/json';
    headers['X-App-ID'] = 'app2';

    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({'token': token}),
    );

    print('📡 Backend Response: ${response.statusCode} ${response.body}');
  }
}
