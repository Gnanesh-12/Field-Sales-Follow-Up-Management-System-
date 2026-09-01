import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import 'app_theme.dart';
import 'login_page.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _employeeIdController = TextEditingController();
  final _pinController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _obscurePin = true;

  @override
  void dispose() {
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
                const Icon(Icons.check_circle_rounded, color: AppTheme.successGreen, size: 20),
                const SizedBox(width: 12),
                Text('Registration successful!', style: AppTheme.bodyMedium.copyWith(color: AppTheme.successGreen)),
              ],
            ),
            backgroundColor: context.surfaceColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginPage()),
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
      backgroundColor: context.backgroundColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // ─── Icon ────────────────────────────
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.primaryBlue,
                  ),
                  child: Icon(
                    Icons.person_add_rounded,
                    size: 44,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),

                // ─── Title ────────────────────────────────────
                Text(
                  'Create Account',
                  style: AppTheme.headingLarge.copyWith(color: context.textPrimaryColor),
                ),
                const SizedBox(height: 8),
                Text(
                  'Join the Field Sales team',
                  style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor),
                ),
                const SizedBox(height: 36),

                // ─── Form ─────────────────────
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: context.surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.borderSubtleColor),
                    boxShadow: AppTheme.subtleShadow,
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Error message
                        if (_errorMessage != null)
                          Container(
                            margin: const EdgeInsets.only(bottom: 20),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppTheme.dangerRed.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.dangerRed.withValues(alpha: 0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded, color: AppTheme.dangerRed, size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: AppTheme.bodySmall.copyWith(
                                      color: AppTheme.dangerRed,
                                      fontWeight: FontWeight.w500,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Full Name
                        TextFormField(
                          controller: _nameController,
                          decoration: AppTheme.inputDecoration(
                            label: 'Full Name',
                            icon: Icons.person_rounded,
                            context: context,
                          ),
                          style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                          validator: (value) => value == null || value.isEmpty ? 'Name is required' : null,
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
                            context: context,
                          ),
                          style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                          textCapitalization: TextCapitalization.characters,
                          validator: (value) => value == null || value.isEmpty ? 'Employee ID is required' : null,
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
                            context: context,
                          ).copyWith(
                            suffixIcon: GestureDetector(
                              onTap: () => setState(() => _obscurePin = !_obscurePin),
                              child: Icon(
                                _obscurePin ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                color: context.textSecondaryColor,
                                size: 20,
                              ),
                            ),
                          ),
                          style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
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
                        ElevatedButton(
                          onPressed: _isLoading ? null : _register,
                          style: AppTheme.primaryButton,
                          child: _isLoading 
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('CREATE ACCOUNT'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // ─── Login Link ───────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const LoginPage()),
                        );
                      },
                      child: Text(
                        'Login',
                        style: AppTheme.bodyMedium.copyWith(
                          color: AppTheme.primaryBlue,
                          fontWeight: FontWeight.w700,
                          decoration: TextDecoration.underline,
                          decorationColor: AppTheme.primaryBlue,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
