import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class UsageService {
  UsageService._();
  static final instance = UsageService._();

  Future<bool> sendUsageLogs(List<Map<String, dynamic>> logs) async {
  final url = '${ApiService.baseUrl}/api/v1/usuage/';
    final response = await http.post(
      Uri.parse(url),
      headers: ApiService.instance.headers,
      body: jsonEncode(logs),
    );
    return response.statusCode == 201;
  }
}
