// lib/services/consent_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class ConsentService {
  ConsentService._();
  static final instance = ConsentService._();

  Future<bool> sendConsent({
    required String researchId,
    required bool conversationLogs,
    required bool appUsage,
    required bool audio,
  }) async {
    final url = '${ApiService.baseUrl}/api/v1/user/consent';
    final response = await http.post(
      Uri.parse(url),
      headers: ApiService.instance.headers,
      body: jsonEncode({
        'researchId': researchId,
        'conversationLogs': conversationLogs,
        'appUsage': appUsage,
        'audio': audio,
      }),
    );

    return response.statusCode == 200;
  }
}
