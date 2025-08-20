import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  ApiService._();
  static final instance = ApiService._();

  // Update this to your backend URL
  static const String baseUrl = 'http://localhost:8000'; // Change this to your server URL
  
  final Map<String, String> _headers = {
    'Content-Type': 'application/json',
  };

  String? _token;

  void setToken(String token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
  }

  Map<String, String> get headers {
    final h = Map<String, String>.from(_headers);
    if (_token != null) {
      h['Authorization'] = 'Bearer $_token';
    }
    return h;
  }

  // Authentication endpoints
  Future<Map<String, dynamic>> register(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: _headers,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          'ok': false,
          'message': 'Registration failed: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['ok'] == true && data['token'] != null) {
          setToken(data['token']);
        }
        return data;
      } else {
        return {
          'ok': false,
          'message': 'Login failed: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  // Chat endpoint
  Future<Map<String, dynamic>> sendMessage(String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat'),
        headers: headers,
        body: jsonEncode({
          'message': message,
          'token': _token,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          'reply': 'Error: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'reply': 'Network error: $e'
      };
    }
  }

  // Health check
  Future<bool> isServerReachable() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/docs'),
        headers: _headers,
      ).timeout(const Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
