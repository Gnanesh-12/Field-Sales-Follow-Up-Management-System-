import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_theme.dart';
import 'providers/auth_provider.dart';
import 'widgets/animated_background.dart';
import 'widgets/glass_card.dart';
import 'widgets/login_form.dart';
import 'register_page.dart';
import 'home_shell.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 1400),
      vsync: this,
    )..forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const HomeShell(),
            transitionsBuilder:
                (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
            transitionDuration: const Duration(milliseconds: 500),
          ),
        );
      }
    });

    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ─── Animated Logo ────────────────────────────
                  ScaleTransition(
                    scale: CurvedAnimation(
                      parent: _animController,
                      curve:
                          const Interval(0.0, 0.4, curve: Curves.elasticOut),
                    ),
                    child: Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppTheme.accentGradient,
                        boxShadow: AppTheme.glowShadow(AppTheme.accentCoral),
                      ),
                      child: const Icon(
                        Icons.storefront_rounded,
                        size: 44,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ─── Title with gradient ──────────────────────
                  FadeTransition(
                    opacity: CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.2, 0.5, curve: Curves.easeOut),
                    ),
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.3),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animController,
                        curve:
                            const Interval(0.2, 0.5, curve: Curves.easeOut),
                      )),
                      child: Column(
                        children: [
                          ShaderMask(
                            shaderCallback: (bounds) =>
                                AppTheme.accentGradient
                                    .createShader(bounds),
                            child: Text(
                              'Welcome Back',
                              style: AppTheme.headingLarge
                                  .copyWith(color: Colors.white),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Sign in to continue',
                            style: AppTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 36),

                  // ─── Glass Card with Form ─────────────────────
                  FadeTransition(
                    opacity: CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.35, 0.7, curve: Curves.easeOut),
                    ),
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.4),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animController,
                        curve:
                            const Interval(0.35, 0.7, curve: Curves.easeOut),
                      )),
                      child: const GlassCard(
                        child: LoginForm(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ─── Register Link ────────────────────────────
                  FadeTransition(
                    opacity: CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.6, 0.9, curve: Curves.easeOut),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Don't have an account? ",
                          style: AppTheme.bodyMedium,
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).pushReplacement(
                              PageRouteBuilder(
                                pageBuilder: (context, animation,
                                        secondaryAnimation) =>
                                    const RegisterPage(),
                                transitionsBuilder: (context, animation,
                                    secondaryAnimation, child) {
                                  return FadeTransition(
                                      opacity: animation, child: child);
                                },
                                transitionDuration:
                                    const Duration(milliseconds: 400),
                              ),
                            );
                          },
                          child: Text(
                            'Register',
                            style: AppTheme.bodyMedium.copyWith(
                              color: AppTheme.accentTeal,
                              fontWeight: FontWeight.w700,
                              decoration: TextDecoration.underline,
                              decorationColor: AppTheme.accentTeal,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
