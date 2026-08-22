import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
          if (authState.error is NetworkException)
            Container(
              margin: const EdgeInsets.only(bottom: 24),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.cloud_off, color: Colors.red),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      authState.error!.message,
                      style: TextStyle(color: Colors.red.shade900),
                    ),
                  ),
                  TextButton(
                    onPressed: authState.isLoading ? null : _submit,
                    child: const Text('RETRY'),
                  ),
                ],
              ),
            ),
          
          if (authState.error is InvalidCredentialsException)
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Text(
                authState.error!.message,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ),

          TextFormField(
            key: const Key('employeeIdField'),
            controller: _employeeIdController,
            decoration: const InputDecoration(
              labelText: 'Employee ID',
              border: OutlineInputBorder(),
              errorStyle: TextStyle(fontSize: 14),
              prefixIcon: Icon(Icons.badge),
            ),
            textCapitalization: TextCapitalization.characters,
            inputFormatters: [UpperCaseTextFormatter()],
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Employee ID is required';
              }
              return null;
            },
            enabled: !authState.isLoading,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 24),
          TextFormField(
            key: const Key('pinField'),
            controller: _pinController,
            decoration: const InputDecoration(
              labelText: 'PIN',
              border: OutlineInputBorder(),
              errorStyle: TextStyle(fontSize: 14),
              prefixIcon: Icon(Icons.lock),
            ),
            keyboardType: TextInputType.number,
            obscureText: true,
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
          const SizedBox(height: 32),
          SizedBox(
            height: 56, // Large touch target
            child: ElevatedButton(
              key: const Key('loginButton'),
              onPressed: authState.isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: authState.isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 3),
                    )
                  : const Text(
                      'LOGIN',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
