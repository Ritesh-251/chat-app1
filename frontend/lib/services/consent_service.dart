// lib/services/consent_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class ConsentService {
  ConsentService._();
  static final instance = ConsentService._();

  /// Save (or update) consent
  Future<bool> sendConsent({
    required bool conversationLogs,
    required bool appUsage,
    required bool audio,
  }) async {
  final url = '${ApiService.baseUrl}/api/v1/consent/';

    final response = await http.post(
      Uri.parse(url),
      headers: ApiService.instance.headers,
      body: jsonEncode({
        'conversationLogs': conversationLogs,
        'appUsage': appUsage,
        'audio': audio,
      }),
    );

    return response.statusCode == 200;
  }

  /// Get consent object for logged-in user
  Future<Map<String, dynamic>?> getConsent() async {
  final url = '${ApiService.baseUrl}/api/v1/consent/';
    final response = await http.get(
      Uri.parse(url),
      headers: ApiService.instance.headers,
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['hasConsent'] == true && data['consent'] != null) {
        return data['consent'] as Map<String, dynamic>;
      }
      return null;
    } else {
      throw Exception("Failed to fetch consent: ${response.body}");
    }
  }
}
