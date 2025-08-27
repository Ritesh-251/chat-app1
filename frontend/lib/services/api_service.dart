import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  ApiService._();
  static final instance = ApiService._();

  // Update this to your backend URL
  // Campus testing: Use hostname (works on any network)
  static const String baseUrl = 'http://riteshs-macbook-pro.local:8000';
  
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
  Future<Map<String, dynamic>> register(
    String name,
    String email, 
    String password,
    String enrollment,
    String batch,
    String course,
    String country,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/user/signup'),
        headers: _headers,
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
          'enrollment': enrollment,
          'batch': batch,
          'course': course,
          'country': country,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'message': data['message'],
          'user': data['data'],
          'token': data['data']?['accessToken']
        };
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
        Uri.parse('$baseUrl/api/v1/user/Signin'),
        headers: _headers,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          // Direct token response format
          setToken(data['token']);
          return {
            'ok': true,
            'token': data['token'],
            'user': data['user']
          };
        } else if (data['success'] == true && data['data']?['accessToken'] != null) {
          // Nested response format
          setToken(data['data']['accessToken']);
          return {
            'ok': true,
            'token': data['data']['accessToken'],
            'user': data['data']['user']
          };
        }
        return {
          'ok': data['success'] ?? false,
          'message': data['message']
        };
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

  // Chat endpoints
  Future<Map<String, dynamic>> startChatWithMessage(String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/chat/start'),
        headers: headers,
        body: jsonEncode({
          'message': message,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to start chat: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  Future<Map<String, dynamic>> sendMessageWithAI(String chatId, String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/chat/$chatId/send'),
        headers: headers,
        body: jsonEncode({
          'message': message,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to send message: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  Future<Map<String, dynamic>> getRecentChat() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/chat/recent'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to get recent chat: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  Future<Map<String, dynamic>> getUserChats({int page = 1, int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/chat/user-chats?page=$page&limit=$limit'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to get user chats: ${response.statusCode}',
          'data': {'chats': []} // Provide empty chats array
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e',
        'data': {'chats': []} // Provide empty chats array
      };
    }
  }

  Future<Map<String, dynamic>> getChatById(String chatId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/chat/$chatId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to get chat: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  // Delete endpoints
  Future<Map<String, dynamic>> deleteChat(String chatId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/chat/$chatId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to delete chat: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  Future<Map<String, dynamic>> deleteMessage(String chatId, String messageId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/v1/chat/$chatId/message/$messageId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to delete message: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  Future<Map<String, dynamic>> checkDeletionEligibility(String chatId, {String? messageId}) async {
    try {
      String url = '$baseUrl/api/v1/chat/$chatId/deletion-status';
      if (messageId != null) {
        url = '$baseUrl/api/v1/chat/$chatId/message/$messageId/deletion-status';
      }
      
      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'ok': data['success'] ?? false,
          'data': data['data'],
          'message': data['message']
        };
      } else {
        return {
          'ok': false,
          'message': 'Failed to check deletion status: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

  Future<bool> isServerReachable() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/user/test'),
        headers: _headers,
      ).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
