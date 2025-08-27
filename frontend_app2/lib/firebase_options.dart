// TEMP PLACEHOLDER — REPLACE WITH FLUTTERFIRE OUTPUT
// Run: flutter pub add firebase_core firebase_auth
// Then: dart pub global activate flutterfire_cli
//       flutterfire configure --project=<your-project>

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform => throw UnimplementedError(
      'Replace firebase_options.dart by running flutterfire configure');
}

// Dummy FirebaseOptions type to appease analyzer before FlutterFire generates the real one.
class FirebaseOptions {
  final String apiKey;
  final String appId;
  final String messagingSenderId;
  final String projectId;
  const FirebaseOptions({
    required this.apiKey,
    required this.appId,
    required this.messagingSenderId,
    required this.projectId,
  });
}