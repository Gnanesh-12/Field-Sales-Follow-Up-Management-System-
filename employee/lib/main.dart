import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'presentation/app_theme.dart';
import 'presentation/login_page.dart';

void main() {
  runApp(
    const ProviderScope(
      child: EmployeeApp(),
    ),
  );
}

class EmployeeApp extends StatelessWidget {
  const EmployeeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Field Sales Pro',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const LoginPage(),
    );
  }
}
