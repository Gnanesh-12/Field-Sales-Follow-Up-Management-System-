import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'presentation/app_theme.dart';
import 'presentation/login_page.dart';
import 'presentation/providers/theme_provider.dart';

void main() {
  runApp(
    const ProviderScope(
      child: EmployeeApp(),
    ),
  );
}

class EmployeeApp extends ConsumerWidget {
  const EmployeeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    return MaterialApp(
      title: 'Field Sales Pro',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      home: const LoginPage(),
    );
  }
}
