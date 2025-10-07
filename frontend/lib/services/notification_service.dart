import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_service.dart';

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  // Get token and send to backend
  static Future<void> initNotifications({String appId = 'app1'}) async {
    // Request permission (iOS)
    await _firebaseMessaging.requestPermission();

    // Get FCM token
    String? token = await _firebaseMessaging.getToken();
    print("🔑 FCM Token: $token");

    // Send token to backend
    if (token != null) {
      await sendTokenToBackend(token, appId: appId);
    }
  }

  /// Sends only the FCM token to backend. The backend determines the DB using the X-App-ID header.
  static Future<void> sendTokenToBackend(String token, {String appId = 'app1'}) async {
    final url = Uri.parse('${ApiService.baseUrl}/api/v1/notification');

    final headers = Map<String, String>.from(ApiService.instance.headers);
    // Ensure content-type and X-App-ID are present
    headers['Content-Type'] = 'application/json';
    headers['X-App-ID'] = appId;

    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({'token': token}),
    );

    print('📡 Backend Response: ${response.statusCode} ${response.body}');
  }
}
