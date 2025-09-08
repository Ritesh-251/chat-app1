// lib/services/consent_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class ConsentService {
  ConsentService._();
  static final instance = ConsentService._();

  Future<bool> sendConsent({
    required bool conversationLogs,
    required bool appUsage,
    required bool audio,
  }) async {
    final url = '${ApiService.baseUrl}/api/v1/consent/';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: ApiService.instance.headers,
        body: jsonEncode({
          'conversationLogs': conversationLogs,
          'appUsage': appUsage,
          'audio': audio,
        }),
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        print('Failed to send consent: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('Error sending consent: $e');
      return false;
    }
  }

  /// Get consent object for logged-in user
  Future<Map<String, dynamic>?> getConsent() async {
    final url = '${ApiService.baseUrl}/api/v1/consent/';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: ApiService.instance.headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['hasConsent'] == true && data['consent'] != null) {
          return Map<String, dynamic>.from(data['consent']);
        }
        return null;
      } else {
        print('Failed to fetch consent: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error fetching consent: $e');
      return null;
    }
  }
}
