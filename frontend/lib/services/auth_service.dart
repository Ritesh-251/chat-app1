import 'dart:async';
import 'api_service.dart';

class User {
  final String email;
  final String token;
  
  User({required this.email, required this.token});
}

class AuthService {
  AuthService._();
  static final instance = AuthService._();

  final _apiService = ApiService.instance;
  final _authStateController = StreamController<User?>.broadcast();
  User? _currentUser;

  Stream<User?> get authChanges => _authStateController.stream;
  User? get currentUser => _currentUser;

  Future<Map<String, dynamic>> signIn(String email, String password) async {
    try {
      final response = await _apiService.login(email, password);
      
      if (response['ok'] == true && response['token'] != null) {
        _currentUser = User(email: email, token: response['token']);
        _authStateController.add(_currentUser);
        return {'success': true, 'user': _currentUser};
      } else {
        return {
          'success': false, 
          'message': response['message'] ?? 'Login failed'
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Login error: $e'
      };
    }
  }

  Future<Map<String, dynamic>> signUp(String email, String password) async {
    try {
      final response = await _apiService.register(email, password);
      
      if (response['ok'] == true) {
        // After successful registration, automatically login
        return await signIn(email, password);
      } else {
        return {
          'success': false,
          'message': response['message'] ?? 'Registration failed'
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Registration error: $e'
      };
    }
  }

  Future<void> signOut() async {
    _currentUser = null;
    _apiService.clearToken();
    _authStateController.add(null);
  }

  void dispose() {
    _authStateController.close();
  }
}