import 'package:flutter_test/flutter_test.dart';
import 'package:chat_app1/main.dart';

void main() {
  testWidgets('App loads and shows login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const App());

    // Check if Login screen text or widget exists.
    expect(find.text('Login'), findsOneWidget);

    // Ensure no unexpected text is present initially.
    expect(find.text('Chatbot'), findsNothing);
  });
}