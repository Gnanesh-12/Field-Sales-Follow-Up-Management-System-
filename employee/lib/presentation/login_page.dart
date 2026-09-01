import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'widgets/login_form.dart';
import 'reset_password_page.dart';
import 'home_shell.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        Widget nextPage = next.isFirstLogin ? const ResetPasswordPage() : const HomeShell();
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => nextPage,
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
            transitionDuration: const Duration(milliseconds: 300),
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: context.backgroundColor,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ─── Header ─────────────────────────────────────────
                    Icon(
                      Icons.storefront_rounded,
                      size: 64,
                      color: AppTheme.primaryBlue,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Field Sales Pro',
                      textAlign: TextAlign.center,
                      style: AppTheme.headingLarge.copyWith(color: context.textPrimaryColor),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in to access your itinerary',
                      textAlign: TextAlign.center,
                      style: AppTheme.bodyLarge.copyWith(color: context.textSecondaryColor),
                    ),
                    const SizedBox(height: 40),

                    // ─── Login Form ─────────────────────────────────────
                    const LoginForm(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
            // ─── Theme Toggle ───────────────────────────────────────
            Positioned(
              top: 8,
              right: 16,
              child: IconButton(
                icon: Icon(context.isDarkMode ? Icons.light_mode : Icons.dark_mode),
                color: context.textSecondaryColor,
                onPressed: () {
                  ref.read(themeProvider.notifier).toggleTheme(context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
