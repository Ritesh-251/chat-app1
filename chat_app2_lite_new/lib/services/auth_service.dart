import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class User {
  final String email;
  final String token;
  final String? refreshToken;
  final DateTime? tokenExpiry;
  
  User({
    required this.email, 
    required this.token, 
    this.refreshToken,
    this.tokenExpiry
  });
}

class AuthService {
  AuthService._();
  static final instance = AuthService._();

  static const String _userEmailKey = 'user_email';
  static const String _userTokenKey = 'user_token';
  static const String _refreshTokenKey = 'user_refresh_token';
  static const String _tokenExpiryKey = 'token_expiry';

  final _apiService = ApiService.instance;
  final _authStateController = StreamController<User?>.broadcast();
  User? _currentUser;
  Timer? _refreshTimer;
  int _refreshRetryCount = 0;
  static const int _maxRefreshRetries = 3;

  Stream<User?> get authChanges => _authStateController.stream;
  User? get currentUser => _currentUser;

  /// Initialize auth service and restore saved user session
  Future<void> initialize() async {
    await _restoreUserSession();
    // Always emit current auth state (null if no user)
    _authStateController.add(_currentUser);
  }

  /// Restore user session from local storage
  Future<void> _restoreUserSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final email = prefs.getString(_userEmailKey);
      final token = prefs.getString(_userTokenKey);
      final refreshToken = prefs.getString(_refreshTokenKey);
      final expiryStr = prefs.getString(_tokenExpiryKey);

      print('🔍 Restoring session - Email: $email, Token: ${token != null ? "Present" : "Null"}, RefreshToken: ${refreshToken != null ? "Present" : "Null"}');

      if (email != null && token != null) {
        DateTime? expiry;
        if (expiryStr != null) {
          expiry = DateTime.parse(expiryStr);
          print('🔍 Token expiry: $expiry, Current time: ${DateTime.now()}');
        }

        _currentUser = User(
          email: email, 
          token: token, 
          refreshToken: refreshToken,
          tokenExpiry: expiry
        );
        
        _apiService.setTokens(token, refreshToken ?? '');
        
        // Check if token needs refresh
        if (expiry != null && DateTime.now().isAfter(expiry.subtract(const Duration(minutes: 2)))) {
          print('🔄 Token expired or expiring soon, attempting refresh...');
          await _attemptTokenRefresh();
        } else {
          _authStateController.add(_currentUser);
          _scheduleTokenRefresh();
        }
        
        print('🔐 User session restored: $email');
      } else {
        print('🚫 No saved session found');
      }
    } catch (e) {
      print('❌ Error restoring user session: $e');
    }
  }

  /// Save user session to local storage
  Future<void> _saveUserSession(User user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userEmailKey, user.email);
      await prefs.setString(_userTokenKey, user.token);
      if (user.refreshToken != null) {
        await prefs.setString(_refreshTokenKey, user.refreshToken!);
      }
      if (user.tokenExpiry != null) {
        await prefs.setString(_tokenExpiryKey, user.tokenExpiry!.toIso8601String());
      }
      print('💾 User session saved: ${user.email}');
    } catch (e) {
      print('❌ Error saving user session: $e');
    }
  }

  /// Clear user session from local storage
  Future<void> _clearUserSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userEmailKey);
      await prefs.remove(_userTokenKey);
      await prefs.remove(_refreshTokenKey);
      await prefs.remove(_tokenExpiryKey);
      print('🗑️ User session cleared');
    } catch (e) {
      print('❌ Error clearing user session: $e');
    }
  }

  /// Calculate token expiry time (15 minutes from now)
  DateTime _calculateTokenExpiry() {
    return DateTime.now().add(const Duration(minutes: 15));
  }

  /// Schedule automatic token refresh
  void _scheduleTokenRefresh() {
    _refreshTimer?.cancel();
    
    if (_currentUser?.tokenExpiry != null) {
      final timeUntilRefresh = _currentUser!.tokenExpiry!
          .subtract(const Duration(minutes: 2)) // Refresh 2 minutes before expiry
          .difference(DateTime.now());
      
      if (timeUntilRefresh.isNegative) {
        // Token should be refreshed immediately
        _attemptTokenRefresh();
      } else {
        _refreshTimer = Timer(timeUntilRefresh, () {
          _attemptTokenRefresh();
        });
        print('⏰ Token refresh scheduled in ${timeUntilRefresh.inMinutes} minutes');
      }
    }
  }

  /// Attempt to refresh the access token
  Future<void> _attemptTokenRefresh() async {
    try {
      print('🔄 Attempting token refresh...');
      final response = await _apiService.refreshToken();

      if (response['ok'] == true) {
        _refreshRetryCount = 0;
        // Update user with new tokens
        final newExpiry = _calculateTokenExpiry();
        _currentUser = User(
          email: _currentUser!.email,
          token: response['token'],
          refreshToken: response['refreshToken'],
          tokenExpiry: newExpiry
        );

        await _saveUserSession(_currentUser!);
        _authStateController.add(_currentUser);
        _scheduleTokenRefresh();

        print('✅ Token refreshed successfully');
      } else {
        final msg = (response['message'] ?? '').toString();
        if (msg.contains('401') || msg.toLowerCase().contains('unauthorized') || msg.toLowerCase().contains('invalid')) {
          print('🔒 Refresh rejected by server: $msg — signing out');
          await signOut();
          return;
        }

        _refreshRetryCount += 1;
        if (_refreshRetryCount <= _maxRefreshRetries) {
          final backoffMs = 1000 * (_refreshRetryCount * 2);
          print('⚠️ Refresh failed (transient). Retry #${_refreshRetryCount} in ${backoffMs}ms');
          Future.delayed(Duration(milliseconds: backoffMs), () => _attemptTokenRefresh());
        } else {
          print('❌ Refresh failed after $_refreshRetryCount attempts. Signing out.');
          await signOut();
        }
      }
    } catch (e) {
      _refreshRetryCount += 1;
      if (_refreshRetryCount <= _maxRefreshRetries) {
        final backoffMs = 1000 * (_refreshRetryCount * 2);
        print('⚠️ Token refresh exception (transient): $e. Retry #${_refreshRetryCount} in ${backoffMs}ms');
        Future.delayed(Duration(milliseconds: backoffMs), () => _attemptTokenRefresh());
      } else {
        print('❌ Token refresh exception after $_refreshRetryCount attempts: $e. Signing out.');
        await signOut();
      }
    }
  }

  Future<Map<String, dynamic>> signIn(String email, String password) async {
    try {
      final response = await _apiService.login(email, password);
      if (response['ok'] == true && response['token'] != null) {
        final tokenExpiry = _calculateTokenExpiry();
        
        _currentUser = User(
          email: email, 
          token: response['token'],
          refreshToken: response['refreshToken'],
          tokenExpiry: tokenExpiry
        );
        
        // Save user session to persistent storage
        await _saveUserSession(_currentUser!);
        
        _authStateController.add(_currentUser);
        _scheduleTokenRefresh();
        
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

  Future<Map<String, dynamic>> signUp(
    String name,
    String enrollmentNumber,
    String batch,
    String course,
    String country,
    String email,
    String password
  ) async {
    try {
      final response = await _apiService.register(
        name,
        email,
        password,
        enrollmentNumber,
        batch,
        course,
        country,
      );
      
      if (response['ok'] == true) {
        if (response['token'] != null) {
          // Registration returned token directly
          final tokenExpiry = _calculateTokenExpiry();
          
          _currentUser = User(
            email: email, 
            token: response['token'],
            refreshToken: response['refreshToken'],
            tokenExpiry: tokenExpiry
          );
          
          // Save user session to persistent storage
          await _saveUserSession(_currentUser!);
          
          _authStateController.add(_currentUser);
          _scheduleTokenRefresh();
          
          return {'success': true, 'user': _currentUser};
        } else {
          // No token, try to login
          return await signIn(email, password);
        }
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

  /// Check if current user token is still valid
  /// Returns: true = valid, false = invalid, null = transient/unknown (don't logout)
  Future<bool?> isTokenValid() async {
    if (_currentUser == null || _currentUser!.token.isEmpty) {
      return false;
    }

    try {
      // Try to make a simple API call to verify token
      final response = await _apiService.getUserChats(page: 1, limit: 1);

      if (response['ok'] == true) return true;

      final msg = (response['message'] ?? '').toString();
      if (msg.toLowerCase().contains('network error')) {
        print('⚠️ Token validation transient/network error: $msg');
        return null;
      }

      if (msg.contains('401') || msg.toLowerCase().contains('unauthorized') || msg.toLowerCase().contains('invalid')) {
        print('🔒 Token invalid according to server: $msg');
        return false;
      }

      print('⚠️ Token validation non-ok but non-auth error: $msg');
      return null;
    } catch (e) {
      print('❌ Token validation exception (transient): $e');
      return null;
    }
  }

  /// Validate current session and logout if invalid
  Future<void> validateSession() async {
    if (_currentUser != null) {
      final isValid = await isTokenValid();
      if (isValid == false) {
        print('🔐 Session invalid, logging out user');
        await signOut();
      } else if (isValid == null) {
        print('⚠️ Session validation unknown (transient). Keeping user logged in');
      } else {
        print('🔒 Session valid');
      }
    }
  }

  Future<void> signOut() async {
    _refreshTimer?.cancel();
    _currentUser = null;
    _apiService.clearToken();
    
    // Clear user session from persistent storage
    await _clearUserSession();
    
    _authStateController.add(null);
  }

  void dispose() {
    _refreshTimer?.cancel();
    _authStateController.close();
  }
}