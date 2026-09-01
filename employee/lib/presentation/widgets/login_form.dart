import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../app_theme.dart';
import '../providers/auth_provider.dart';
import '../../data/auth_repository.dart';

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}

class LoginForm extends ConsumerStatefulWidget {
  const LoginForm({super.key});

  @override
  ConsumerState<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _employeeIdController = TextEditingController();
  final _pinController = TextEditingController();
  bool _obscurePin = true;

  @override
  void dispose() {
    _employeeIdController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  void _submit() {
    ref.read(authProvider.notifier).clearError();

    if (_formKey.currentState!.validate()) {
      ref.read(authProvider.notifier).login(
            _employeeIdController.text,
            _pinController.text,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ─── Network Error Banner ─────────────────────────────
          if (authState.error is NetworkException)
            _AnimatedErrorBanner(
              icon: Icons.cloud_off_rounded,
              message: authState.error!.message,
              onRetry: authState.isLoading ? null : _submit,
            ),

          // ─── Invalid Credentials Error ────────────────────────
          if (authState.error is InvalidCredentialsException)
            _AnimatedErrorBanner(
              icon: Icons.error_outline_rounded,
              message: authState.error!.message,
            ),

          // ─── Employee ID Field ────────────────────────────────
          TextFormField(
            key: const Key('employeeIdField'),
            controller: _employeeIdController,
            decoration: AppTheme.inputDecoration(
              label: 'Employee ID',
              icon: Icons.badge_rounded,
              context: context,
            ),
            style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
            textCapitalization: TextCapitalization.characters,
            inputFormatters: [UpperCaseTextFormatter()],
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Employee ID is required';
              }
              final RegExp employeeIdRegex = RegExp(r'^[A-Z]{2}-[A-Z]{2}-\d{3}$');
              if (!employeeIdRegex.hasMatch(value)) {
                return 'Format must be SE-FS-001';
              }
              return null;
            },
            enabled: !authState.isLoading,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 20),

          // ─── PIN Field ────────────────────────────────────────
          TextFormField(
            key: const Key('pinField'),
            controller: _pinController,
            decoration: AppTheme.inputDecoration(
              label: 'PIN',
              icon: Icons.lock_rounded,
              context: context,
            ).copyWith(
              suffixIcon: GestureDetector(
                onTap: () => setState(() => _obscurePin = !_obscurePin),
                child: Icon(
                  _obscurePin
                      ? Icons.visibility_off_rounded
                      : Icons.visibility_rounded,
                  color: context.textMutedColor,
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
            enabled: !authState.isLoading,
            onFieldSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 24),

          // ─── Login Button ─────────────────────────────────────
          ElevatedButton(
            key: const Key('loginButton'),
            style: AppTheme.primaryButton,
            onPressed: authState.isLoading ? null : _submit,
            child: authState.isLoading
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text('Sign In'),
          ),
        ],
      ),
    );
  }
}

class _AnimatedErrorBanner extends StatelessWidget {
  final IconData icon;
  final String message;
  final VoidCallback? onRetry;

  const _AnimatedErrorBanner({
    required this.icon,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.dangerRed.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dangerRed.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.dangerRed, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.dangerRed,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (onRetry != null)
            TextButton(
              onPressed: onRetry,
              child: Text('RETRY',
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.dangerRed,
                    fontWeight: FontWeight.w700,
                  )),
            ),
        ],
      ),
    );
  }
}
