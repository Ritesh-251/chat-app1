# 🤖 AI Chat Application

A full-stack AI-powered chat application built with **Flutter** (frontend) and **Node.js/TypeScript** (backend), featuring real-time messaging with AI assistants, WebSocket connections, and cross-platform support.

## 🌟 Overview

This application provides an interactive chat experience with AI-powered assistants. Users can engage in conversations with customizable AI chatbots (Jojo and Gini) that serve different purposes including casual chat, learning assistance, and more.

## 🚀 Key Features

### 🎯 Core Features
- **AI-Powered Chat**: Real-time conversations with AI assistants using streaming responses
- **Multiple AI Personalities**: Choose between Jojo (Male) and Gini (Female) chatbot personalities
- **Cross-Platform**: Web, iOS, and Android support via Flutter
- **Real-time Messaging**: WebSocket-based instant messaging with typing indicators
- **User Authentication**: Secure registration and login system
- **Chat History**: Persistent message storage and conversation management
- **Profile Customization**: Personalized chatbot selection and usage preferences

### 🛠 Technical Features
- **Streaming AI Responses**: Real-time AI response streaming via WebSocket
- **Message Management**: Archive, restore, and delete chat conversations
- **Connection Status**: Real-time connection monitoring
- **Usage Analytics**: App usage tracking and consent management
- **Push Notifications**: Background message notifications
- **Responsive Design**: Material Design 3 UI components

## 🏗️ Architecture

### Project Structure
```
chat-app1/
├── frontend/                    # Flutter application
│   ├── lib/
│   │   ├── main.dart           # App entry point
│   │   ├── screens/            # UI screens
│   │   │   ├── chat_screen.dart
│   │   │   ├── login_screen.dart
│   │   │   ├── register_screen.dart
│   │   │   └── chatbot_profile.dart
│   │   ├── services/           # Business logic
│   │   │   ├── api_service.dart
│   │   │   ├── auth_service.dart
│   │   │   ├── chat_service.dart
│   │   │   └── websocket_service.dart
│   │   └── widgets/            # Reusable components
│   └── pubspec.yaml
├── backend/                     # Node.js/TypeScript server
│   ├── src/
│   │   ├── app.ts              # Express app setup
│   │   ├── controllers/        # Route controllers
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   └── services/           # Business services
│   └── package.json
└── chat_app2_lite_new/         # Alternative lite version
```

### Technology Stack

#### Frontend (Flutter)
- **Framework**: Flutter SDK
- **Language**: Dart
- **UI**: Material Design 3
- **State Management**: Service-based architecture
- **Networking**: HTTP client with WebSocket support
- **Platforms**: Web, iOS, Android

#### Backend (Node.js)
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO for WebSocket connections
- **Authentication**: JWT tokens
- **AI Integration**: Custom AI service with streaming

## 📋 Prerequisites

- **Flutter SDK** (latest stable version)
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **Git**

## 🚀 Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/Ritesh-251/chat-app1.git
cd chat-app1
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string and other configs

# Start the server
npm run dev
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend

# Install Flutter dependencies
flutter pub get

# Update API endpoint in lib/services/api_service.dart
# Change baseUrl to 'http://localhost:8000'

# Run the app
flutter run -d chrome  # For web
# or
flutter run            # For mobile (requires emulator/device)
```

## 🔧 Configuration

### Environment Variables (Backend)
Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
ACCESS_TOKEN_SECRET=your_jwt_secret_here
PORT=8000
NODE_ENV=development
```

### API Configuration (Frontend)
Update `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://localhost:8000';
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/user/register` - User registration
- `POST /api/v1/user/login` - User login

### Chat Endpoints
- `POST /api/v1/chat/start-streaming` - Start new chat with streaming
- `POST /api/v1/chat/send-streaming` - Send message with streaming response
- `GET /api/v1/chat/user-chats` - Get user's chat history
- `POST /api/v1/chat/:chatId/archive` - Archive a chat
- `POST /api/v1/chat/:chatId/restore` - Restore archived chat

### WebSocket Events
- `ai_response_chunk` - Streaming AI response data
- `ai_response_complete` - AI response completion
- `user_typing_start/stop` - Typing indicators

## 🎨 Features in Detail

### AI Chat Personalities
- **Jojo (Male)**: Casual, friendly conversation style
- **Gini (Female)**: Professional, helpful assistant style

### Usage Purposes
- Casual conversation
- Learning and education
- Problem-solving assistance
- Creative writing help

### Message Management
- Real-time message streaming
- Message history persistence
- Chat archiving and restoration
- Message deletion with confirmation

## 🔒 Security Features

- JWT-based authentication
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended for production)
- Secure WebSocket connections

## 📱 Platform Support

### Mobile Apps
- **Android**: APK build support
- **iOS**: IPA build support (requires Xcode)

### Web Application
- Progressive Web App (PWA) capabilities
- Responsive design for all screen sizes
- Modern browser compatibility

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to services like Heroku, DigitalOcean, or AWS

### Frontend Deployment
```bash
# Web deployment
flutter build web

# Android APK
flutter build apk

# iOS build (macOS required)
flutter build ios
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Flutter team for the amazing cross-platform framework
- MongoDB for the robust database solution
- Socket.IO for real-time communication capabilities
- Material Design for the beautiful UI components

## 📞 Support

For support open an issue in the GitHub repository.

---

**Built with ❤️ by [Ritesh-251](https://github.com/Ritesh-251)**
