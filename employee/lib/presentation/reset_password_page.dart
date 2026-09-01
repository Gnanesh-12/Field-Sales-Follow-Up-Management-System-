import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'home_shell.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _oldPinController = TextEditingController();
  final _newPinController = TextEditingController();
  final _confirmPinController = TextEditingController();

  bool _obscureOldPin = true;
  bool _obscureNewPin = true;
  bool _obscureConfirmPin = true;

  @override
  void dispose() {
    _oldPinController.dispose();
    _newPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState!.validate()) {
      final storage = ref.read(secureStorageProvider);
      final employeeId = await storage.read(key: 'employee_id');
      
      if (employeeId == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Employee ID not found. Please log out and try again.')),
        );
        return;
      }

      final success = await ref.read(authProvider.notifier).resetPassword(
        employeeId,
        _oldPinController.text,
        _newPinController.text,
      );

      if (success) {
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const HomeShell()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.backgroundColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(context.isDarkMode ? Icons.light_mode : Icons.dark_mode),
            color: context.textPrimaryColor,
            onPressed: () {
              ref.read(themeProvider.notifier).toggleTheme(context);
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.primaryBlue,
                  ),
                  child: Icon(
                    Icons.lock_reset_rounded,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Setup Your PIN',
                  style: AppTheme.headingLarge.copyWith(color: context.textPrimaryColor),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please change your temporary PIN',
                  style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor),
                ),
                const SizedBox(height: 36),
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
                        if (authState.error != null)
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
                                Icon(Icons.error_outline, color: AppTheme.dangerRed, size: 22),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    authState.error!.message,
                                    style: AppTheme.bodySmall.copyWith(
                                      color: AppTheme.dangerRed,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        TextFormField(
                          controller: _oldPinController,
                          decoration: AppTheme.inputDecoration(
                            label: 'Current PIN',
                            icon: Icons.password_rounded,
                            context: context,
                          ).copyWith(
                            suffixIcon: GestureDetector(
                              onTap: () => setState(() => _obscureOldPin = !_obscureOldPin),
                              child: Icon(
                                _obscureOldPin ? Icons.visibility_off : Icons.visibility,
                                color: context.textSecondaryColor,
                                size: 20,
                              ),
                            ),
                          ),
                          style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                          keyboardType: TextInputType.number,
                          obscureText: _obscureOldPin,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Required';
                            return null;
                          },
                          textInputAction: TextInputAction.next,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _newPinController,
                          decoration: AppTheme.inputDecoration(
                            label: 'New PIN',
                            icon: Icons.lock_rounded,
                            context: context,
                          ).copyWith(
                            suffixIcon: GestureDetector(
                              onTap: () => setState(() => _obscureNewPin = !_obscureNewPin),
                              child: Icon(
                                _obscureNewPin ? Icons.visibility_off : Icons.visibility,
                                color: context.textSecondaryColor,
                                size: 20,
                              ),
                            ),
                          ),
                          style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                          keyboardType: TextInputType.number,
                          obscureText: _obscureNewPin,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Required';
                            if (value.length < 4) return 'At least 4 digits';
                            return null;
                          },
                          textInputAction: TextInputAction.next,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _confirmPinController,
                          decoration: AppTheme.inputDecoration(
                            label: 'Confirm New PIN',
                            icon: Icons.lock_outline_rounded,
                            context: context,
                          ).copyWith(
                            suffixIcon: GestureDetector(
                              onTap: () => setState(() => _obscureConfirmPin = !_obscureConfirmPin),
                              child: Icon(
                                _obscureConfirmPin ? Icons.visibility_off : Icons.visibility,
                                color: context.textSecondaryColor,
                                size: 20,
                              ),
                            ),
                          ),
                          style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                          keyboardType: TextInputType.number,
                          obscureText: _obscureConfirmPin,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                          validator: (value) {
                            if (value != _newPinController.text) return 'PINs do not match';
                            return null;
                          },
                          onFieldSubmitted: (_) => _submit(),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: authState.isLoading ? null : _submit,
                          style: AppTheme.primaryButton,
                          child: authState.isLoading 
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('SET PIN & CONTINUE'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
