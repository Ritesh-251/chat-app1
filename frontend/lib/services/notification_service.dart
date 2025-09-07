import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';

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

  static Future<void> sendTokenToBackend(String token) async {
    final response = await http.post(
      Uri.parse('http://192.168.1.5:8000/api/v1/notification'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({"token": token}),
    );

    print("📡 Backend Response: ${response.body}");
  }
}
