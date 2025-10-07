import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  ApiService._();
  static final instance = ApiService._();

  // Update this to your backend URL
  // Using IP address for reliable mobile connection
  static const String baseUrl = 'http://10.236.213.163:8000';
  
  static const String _tokenKey = 'api_token';
  static const String _refreshTokenKey = 'refresh_token';
  
  final Map<String, String> _headers = {
    'Content-Type': 'application/json',
  };

  String? _token;
  String? _refreshToken;

  /// Initialize API service and restore saved token
  Future<void> initialize() async {
    await _restoreToken();
  }

  /// Restore token from local storage
  Future<void> _restoreToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString(_tokenKey);
      _refreshToken = prefs.getString(_refreshTokenKey);
      if (_token != null) {
        print('🔑 API token restored');
      }
      if (_refreshToken != null) {
        print('🔑 Refresh token restored');
      }
    } catch (e) {
      print('❌ Error restoring API tokens: $e');
    }
  }

  /// Save token to local storage
  Future<void> _saveToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, token);
      print('💾 API token saved');
    } catch (e) {
      print('❌ Error saving API token: $e');
    }
  }

  /// Save refresh token to local storage
  Future<void> _saveRefreshToken(String refreshToken) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_refreshTokenKey, refreshToken);
      print('💾 Refresh token saved');
    } catch (e) {
      print('❌ Error saving refresh token: $e');
    }
  }

  /// Clear token from local storage
  Future<void> _clearToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_tokenKey);
      await prefs.remove(_refreshTokenKey);
      print('🗑️ API tokens cleared');
    } catch (e) {
      print('❌ Error clearing API tokens: $e');
    }
  }

  void setToken(String token) {
    _token = token;
    _saveToken(token); // Persist token
  }

  void setRefreshToken(String refreshToken) {
    _refreshToken = refreshToken;
    _saveRefreshToken(refreshToken); // Persist refresh token
  }

  void setTokens(String token, String refreshToken) {
    _token = token;
    _refreshToken = refreshToken;
    _saveToken(token);
    _saveRefreshToken(refreshToken);
    print('🔑 Tokens set - Access: ${token.substring(0, 20)}..., Refresh: ${refreshToken.isNotEmpty ? "Present" : "Empty"}');
  }

  void clearToken() {
    _token = null;
    _refreshToken = null;
    _clearToken(); // Clear persisted tokens
  }

  Map<String, String> get headers {
    final h = Map<String, String>.from(_headers);
    if (_token != null) {
      h['Authorization'] = 'Bearer $_token';
      print('🔑 Including Authorization header in request');
    } else {
      print('⚠️ No token available - Authorization header not included');
    }
    return h;
  }

  // Authentication endpoints
  // Token refresh endpoint
  Future<Map<String, dynamic>> refreshToken() async {
    if (_refreshToken == null) {
      return {
        'ok': false,
        'message': 'No refresh token available'
      };
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/user/refresh-token'),
        headers: _headers,
        body: jsonEncode({'refreshToken': _refreshToken}),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // Update tokens
        setTokens(data['token'], data['refreshToken']);
        
        return {
          'ok': true,
          'token': data['token'],
          'refreshToken': data['refreshToken'],
          'message': 'Token refreshed successfully'
        };
      } else {
        return {
          'ok': false,
          'message': data['message'] ?? 'Token refresh failed'
        };
      }
    } catch (e) {
      print('🔄 Token refresh error: $e');
      return {
        'ok': false,
        'message': 'Token refresh error: $e'
      };
    }
  }
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
        headers: ApiService.instance.headers,
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

  if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        
        // Store tokens if available
        if (data['token'] != null) {
          setTokens(data['token'], data['refreshToken'] ?? '');
        }
        
        return {
          'ok': data['success'] ?? false,
          'message': data['message'],
          'user': data['user'] ?? data['data'],
          'token': data['token'] ?? data['data']?['accessToken'],
          'refreshToken': data['refreshToken']
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
        headers: ApiService.instance.headers,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          // Store both access and refresh tokens
          setTokens(data['token'], data['refreshToken'] ?? '');
          return {
            'ok': true,
            'token': data['token'],
            'refreshToken': data['refreshToken'],
            'user': data['user']
          };
        } else if (data['success'] == true && data['data']?['accessToken'] != null) {
          // Nested response format
          setTokens(data['data']['accessToken'], data['data']['refreshToken'] ?? '');
          return {
            'ok': true,
            'token': data['data']['accessToken'],
            'refreshToken': data['data']['refreshToken'],
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

  /// Save chatbot profile for personalized AI responses
  Future<Map<String, dynamic>> saveChatbotProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/v1/chatbot'),
        headers: headers,
        body: jsonEncode(profileData),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'ok': true,
          'data': data['data'],
          'message': data['message'] ?? 'Profile saved successfully'
        };
      } else {
        return {
          'ok': false,
          'message': data['message'] ?? 'Failed to save profile: ${response.statusCode}'
        };
      }
    } catch (e) {
      return {
        'ok': false,
        'message': 'Network error: $e'
      };
    }
  }

}
