# Flutter Chatbot Frontend

A beautiful, cross-platform chatbot app built with Flutter that connects to the Ollama backend.

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (latest stable version)
- Chrome browser (for web development)
- Android Studio/Xcode (for mobile development)

### Installation

1. **Install dependencies:**
   ```bash
   flutter pub get
   ```

2. **Configure API endpoint:**
   
   Update the `baseUrl` in `lib/services/api_service.dart`:
   ```dart
   static const String baseUrl = 'http://localhost:8000';
   ```

3. **Run the app:**
   ```bash
   # Web
   flutter run -d chrome
   
   # Android (with emulator/device)
   flutter run
   
   # iOS (with simulator/device)
   flutter run
   ```

## 📱 Features

- **Modern UI** with Material Design 3
- **Cross-platform** (Web, iOS, Android)
- **Real-time chat** with Ollama AI
- **User authentication** (register/login)
- **Connection status** indicators
- **Message history** management
- **Responsive design**

## 🏗️ Architecture

```
lib/
├── main.dart                 # App entry point
├── screens/                  # UI screens
│   ├── start_screen.dart
│   ├── login_screen.dart
│   ├── register_screen.dart
│   └── chat_screen.dart
├── services/                 # Business logic
│   ├── api_service.dart      # HTTP client
│   ├── auth_service.dart     # Authentication
│   └── chat_service.dart     # Chat management
└── widgets/                  # Reusable components
    ├── chat_bubble.dart
    ├── primary_button.dart
    └── text_field.dart
```

## 🛠️ Development

### Code Style
This project follows Dart/Flutter best practices:
- Use `flutter analyze` to check code quality
- Follow the [effective Dart guidelines](https://dart.dev/guides/language/effective-dart)

### Building

```bash
# Debug build
flutter build web --debug

# Release build
flutter build web --release
flutter build apk --release
flutter build ios --release
```

### Testing

```bash
# Run tests
flutter test

# Run integration tests
flutter drive --target=test_driver/app.dart
```

## 🔧 Configuration

### API Service
The app communicates with the backend through `ApiService`. Key methods:
- `register()` - User registration
- `login()` - User authentication  
- `sendMessage()` - Send chat messages
- `isServerReachable()` - Health check

### Environment Setup
For different environments, update the `baseUrl` in `api_service.dart`:

```dart
// Development
static const String baseUrl = 'http://localhost:8000';

// Production  
static const String baseUrl = 'https://your-production-url.com';
```

## 📦 Dependencies

Key packages used:
- `http` - HTTP client for API calls
- `provider` - State management (if needed)
- Material Design components (built-in)

## 🎨 UI Components

### Custom Widgets
- **ChatBubble** - Message display with user/bot styling
- **PrimaryButton** - Consistent button styling with loading states
- **LabeledField** - Form input with labels and validation

### Theming
The app uses Material Design 3 with a custom color scheme defined in `main.dart`.

## 🔍 Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure backend server is running on port 8000
   - Check `baseUrl` in `api_service.dart`

2. **Build errors**
   - Run `flutter clean && flutter pub get`
   - Check Flutter SDK version compatibility

3. **Web CORS issues**
   - Ensure backend has CORS enabled for your domain
   - Use `flutter run -d chrome --web-renderer html` if needed

### Debug Mode
```bash
# Run with verbose logging
flutter run -v

# Check connected devices
flutter devices
```
