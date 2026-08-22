import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/auth_provider.dart';
import 'widgets/login_form.dart';
import 'register_page.dart';

class LoginPage extends ConsumerWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        // Navigate to dashboard placeholder
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const DashboardPlaceholder()),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Employee Login'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.storefront,
                  size: 80,
                  color: Colors.blueAccent,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Welcome Back',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 32),
                const LoginForm(),
                const SizedBox(height: 24),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                          builder: (context) => const RegisterPage()),
                    );
                  },
                  child: const Text('New Register'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class DashboardPlaceholder extends StatelessWidget {
  const DashboardPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: const Center(
        child: Text(
          'Welcome to the Dashboard!',
          style: TextStyle(fontSize: 20),
        ),
      ),
    );
  }
}
