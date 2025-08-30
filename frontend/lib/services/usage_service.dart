import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class UsageService {
  UsageService._();
  static final instance = UsageService._();

  Future<bool> sendUsageLogs(List<Map<String, dynamic>> logs) async {
    final url = '${ApiService.baseUrl}/api/v1/usuage/';
    print('[USAGE] Sending usage logs to: ' + url);
    print('[USAGE] Logs: ' + jsonEncode(logs));
    final response = await http.post(
      Uri.parse(url),
      headers: ApiService.instance.headers,
      body: jsonEncode(logs),
    );
    print('[USAGE] Response status: ' + response.statusCode.toString());
    print('[USAGE] Response body: ' + response.body);
    return response.statusCode == 201;
  }
}
