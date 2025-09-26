import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/start_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/consent_screen.dart';
import 'screens/chatbot_profile.dart';
import 'services/notification_service.dart';

import 'services/background_service.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/chat_service.dart';


// Local notifications instance
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// Background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling background message: ${message.messageId}");
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Initialize API and Auth services to restore saved state
  await ApiService.instance.initialize();
  await AuthService.instance.initialize();
  
  // Initialize Chat service with WebSocket - but only if user is authenticated
  final currentUser = AuthService.instance.currentUser;
  if (currentUser != null) {
    await ChatService.instance.initialize();
  }
  
  runApp(const App());
}

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initNotifications();
    _initBackgroundFetch();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    print("App lifecycle state changed: $state");
    
    switch (state) {
      case AppLifecycleState.resumed:
        print("App resumed - back to foreground");
        BackgroundService.onAppResumed();
        BackgroundService.performMaintenanceTasks();
        break;
      case AppLifecycleState.inactive:
        print("App inactive");
        break;
      case AppLifecycleState.paused:
        print("App paused - moved to background");
        BackgroundService.onAppPaused();
        break;
      case AppLifecycleState.detached:
        print("App detached");
        break;
      case AppLifecycleState.hidden:
        print("App hidden");
        break;
    }
  }

  void _initBackgroundFetch() async {
    // Initialize the background service
    await BackgroundService.initialize();
    print('[App] Background service initialized successfully');
  }

 void _initNotifications() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  await messaging.requestPermission();

  // Get FCM Token
  String? token = await messaging.getToken();
  print(" FCM Token: $token");

  // Send token to backend (new)
  if (token != null) {
    await NotificationService.sendTokenToBackend(token, appId: 'app1');
  }

  // Foreground message listener
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print("📩 Foreground message: ${message.notification?.title}");
    _showNotification(message);
  });
}


    void _showNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'channel_id',
      'channel_name',
      channelDescription: 'Default notification channel',
      importance: Importance.max,
      priority: Priority.high,
      icon: '@drawable/ic_launcher', 
    );

    const NotificationDetails platformDetails =
        NotificationDetails(android: androidDetails);

    await flutterLocalNotificationsPlugin.show(
      0,
      message.notification?.title ?? '📢 Notification',
      message.notification?.body ?? '',
      platformDetails,
    );
  }


  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Sathi',
      theme: ThemeData(
        textTheme: GoogleFonts.poppinsTextTheme(),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E7D32)),
        useMaterial3: true,
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(14)),
          ),
        ),
      ),
      initialRoute: StartScreen.route,
      routes: {
        StartScreen.route: (_) => const StartScreen(),
        LoginScreen.route: (_) => const LoginScreen(),
        ConsentScreen.route: (_) => ConsentScreen(),
        RegisterScreen.route: (_) => const RegisterScreen(),
        ChatbotProfileScreen.route: (_) => const ChatbotProfileScreen(),
        ChatScreen.route: (_) => const ChatScreen(),
      },
    );
  }
}