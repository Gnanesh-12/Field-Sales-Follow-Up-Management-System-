import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:employee_app/presentation/login_page.dart';
import 'package:employee_app/data/auth_repository.dart';
import 'package:employee_app/presentation/providers/auth_provider.dart';

class MockAuthRepository extends Mock implements AuthRepository {}
class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockAuthRepository mockAuthRepository;
  late MockFlutterSecureStorage mockSecureStorage;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
    mockSecureStorage = MockFlutterSecureStorage();
  });

  Widget createWidgetUnderTest() {
    return ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(mockAuthRepository),
        secureStorageProvider.overrideWithValue(mockSecureStorage),
      ],
      child: const MaterialApp(
        home: LoginPage(),
      ),
    );
  }

  testWidgets('empty-field validation shows errors', (WidgetTester tester) async {
    await tester.pumpWidget(createWidgetUnderTest());

    // Find the login button and tap it without entering any text
    final loginButton = find.byKey(const Key('loginButton'));
    await tester.tap(loginButton);
    await tester.pump();

    // Verify validation errors are shown
    expect(find.text('Employee ID is required'), findsOneWidget);
    expect(find.text('PIN is required'), findsOneWidget);

    // Verify login was never called on repository
    verifyNever(() => mockAuthRepository.login(any(), any()));
  });

  testWidgets('PIN-length validation shows error for short PIN', (WidgetTester tester) async {
    await tester.pumpWidget(createWidgetUnderTest());

    // Enter valid employee ID and short PIN
    await tester.enterText(find.byKey(const Key('employeeIdField')), 'EMP123');
    await tester.enterText(find.byKey(const Key('pinField')), '123');

    final loginButton = find.byKey(const Key('loginButton'));
    await tester.tap(loginButton);
    await tester.pump();

    // Verify PIN validation error
    expect(find.text('Employee ID is required'), findsNothing);
    expect(find.text('PIN must be at least 4 digits'), findsOneWidget);

    verifyNever(() => mockAuthRepository.login(any(), any()));
  });

  testWidgets('loading-state button-disable behavior', (WidgetTester tester) async {
    // Setup mock repository to return a delayed response
    when(() => mockAuthRepository.login(any(), any())).thenAnswer(
      (_) async {
        await Future.delayed(const Duration(seconds: 1));
        return {'token': 'test_token', 'role': 'test_role'};
      },
    );
    when(() => mockSecureStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});

    await tester.pumpWidget(createWidgetUnderTest());

    // Enter valid credentials
    await tester.enterText(find.byKey(const Key('employeeIdField')), 'EMP123');
    await tester.enterText(find.byKey(const Key('pinField')), '1234');

    // Tap login button
    final loginButton = find.byKey(const Key('loginButton'));
    await tester.tap(loginButton);
    
    // Pump to start the Future
    await tester.pump();

    // Verify CircularProgressIndicator is shown
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    
    // Verify the button is disabled (ElevatedButton's onPressed should be null)
    final elevatedButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(elevatedButton.onPressed, isNull);

    // Wait for the future to complete
    await tester.pumpAndSettle();

    // Verify navigation to dashboard occurred
    expect(find.text('Welcome to the Dashboard!'), findsOneWidget);
  });
}
