import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import 'app_theme.dart';
import 'login_page.dart';
import 'widgets/animated_background.dart';
import 'widgets/glass_card.dart';
import 'widgets/gradient_button.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _employeeIdController = TextEditingController();
  final _pinController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _obscurePin = true;
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
    _nameController.dispose();
    _employeeIdController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  void _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final repository = AuthRepository();
      await repository.register(
        name: _nameController.text,
        employeeId: _employeeIdController.text,
        pin: _pinController.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded,
                    color: AppTheme.accentGreen, size: 20),
                const SizedBox(width: 12),
                Text('Registration successful!',
                    style: AppTheme.bodyMedium
                        .copyWith(color: AppTheme.textPrimary)),
              ],
            ),
            backgroundColor: AppTheme.cardDark,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const LoginPage(),
            transitionsBuilder:
                (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ─── Animated Icon ────────────────────────────
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
                        gradient: AppTheme.tealGradient,
                        boxShadow: AppTheme.glowShadow(AppTheme.accentTeal),
                      ),
                      child: const Icon(
                        Icons.person_add_rounded,
                        size: 44,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ─── Title ────────────────────────────────────
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
                                AppTheme.tealGradient
                                    .createShader(bounds),
                            child: Text(
                              'Create Account',
                              style: AppTheme.headingLarge
                                  .copyWith(color: Colors.white),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Join the Field Sales team',
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
                      curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
                    ),
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.4),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animController,
                        curve:
                            const Interval(0.3, 0.7, curve: Curves.easeOut),
                      )),
                      child: GlassCard(
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Error message
                              if (_errorMessage != null)
                                TweenAnimationBuilder<double>(
                                  tween: Tween(begin: 0.0, end: 1.0),
                                  duration:
                                      const Duration(milliseconds: 400),
                                  curve: Curves.easeOut,
                                  builder: (context, value, child) {
                                    return Opacity(
                                      opacity: value,
                                      child: Transform.translate(
                                        offset:
                                            Offset(0, -10 * (1 - value)),
                                        child: child,
                                      ),
                                    );
                                  },
                                  child: Container(
                                    margin:
                                        const EdgeInsets.only(bottom: 20),
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: AppTheme.accentCoral
                                          .withValues(alpha: 0.12),
                                      borderRadius:
                                          BorderRadius.circular(14),
                                      border: Border.all(
                                          color: AppTheme.accentCoral
                                              .withValues(alpha: 0.3)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(
                                            Icons.error_outline_rounded,
                                            color: AppTheme.accentPink,
                                            size: 20),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            _errorMessage!,
                                            style: AppTheme.bodySmall
                                                .copyWith(
                                              color: AppTheme.accentPink,
                                              fontWeight: FontWeight.w500,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                              // Full Name
                              TextFormField(
                                controller: _nameController,
                                decoration: AppTheme.inputDecoration(
                                  label: 'Full Name',
                                  icon: Icons.person_rounded,
                                ),
                                style: AppTheme.bodyLarge,
                                validator: (value) => value == null ||
                                        value.isEmpty
                                    ? 'Name is required'
                                    : null,
                                enabled: !_isLoading,
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 18),

                              // Employee ID
                              TextFormField(
                                controller: _employeeIdController,
                                decoration: AppTheme.inputDecoration(
                                  label: 'Employee ID',
                                  icon: Icons.badge_rounded,
                                ),
                                style: AppTheme.bodyLarge,
                                textCapitalization:
                                    TextCapitalization.characters,
                                validator: (value) => value == null ||
                                        value.isEmpty
                                    ? 'Employee ID is required'
                                    : null,
                                enabled: !_isLoading,
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 18),

                              // PIN
                              TextFormField(
                                controller: _pinController,
                                decoration: AppTheme.inputDecoration(
                                  label: 'PIN (4-6 digits)',
                                  icon: Icons.lock_rounded,
                                ).copyWith(
                                  suffixIcon: GestureDetector(
                                    onTap: () => setState(
                                        () => _obscurePin = !_obscurePin),
                                    child: Icon(
                                      _obscurePin
                                          ? Icons.visibility_off_rounded
                                          : Icons.visibility_rounded,
                                      color: AppTheme.textMuted,
                                      size: 20,
                                    ),
                                  ),
                                ),
                                style: AppTheme.bodyLarge,
                                keyboardType: TextInputType.number,
                                obscureText: _obscurePin,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  LengthLimitingTextInputFormatter(6),
                                ],
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'PIN is required';
                                  }
                                  if (value.length < 4) {
                                    return 'PIN must be at least 4 digits';
                                  }
                                  return null;
                                },
                                enabled: !_isLoading,
                                onFieldSubmitted: (_) => _register(),
                              ),
                              const SizedBox(height: 28),

                              // Register Button
                              GradientButton(
                                text: 'CREATE ACCOUNT',
                                onPressed:
                                    _isLoading ? null : _register,
                                isLoading: _isLoading,
                                gradient: AppTheme.tealGradient,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ─── Login Link ───────────────────────────────
                  FadeTransition(
                    opacity: CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.6, 0.9, curve: Curves.easeOut),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Already have an account? ',
                          style: AppTheme.bodyMedium,
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).pushReplacement(
                              PageRouteBuilder(
                                pageBuilder: (context, animation,
                                        secondaryAnimation) =>
                                    const LoginPage(),
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
                            'Login',
                            style: AppTheme.bodyMedium.copyWith(
                              color: AppTheme.accentCoral,
                              fontWeight: FontWeight.w700,
                              decoration: TextDecoration.underline,
                              decorationColor: AppTheme.accentCoral,
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
