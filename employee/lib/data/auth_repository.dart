import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import 'package:flutter/foundation.dart';

String get _baseUrl {
  if (const bool.hasEnvironment('API_URL')) {
    return const String.fromEnvironment('API_URL');
  }
  if (kIsWeb) return 'http://localhost:3000';
  return Platform.isAndroid ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

class AuthException implements Exception {
  final String message;
  AuthException(this.message);
  
  @override
  String toString() => message;
}

class InvalidCredentialsException extends AuthException {
  InvalidCredentialsException() : super('Invalid Employee ID or PIN');
}

class NetworkException extends AuthException {
  NetworkException() : super('Network error. Please check your connection and try again.');
}

class AuthRepository {
  final http.Client client;

  AuthRepository({http.Client? client}) : client = client ?? http.Client();

  Future<Map<String, dynamic>> login(String employeeId, String pin) async {
    try {
      final response = await client.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'employeeId': employeeId, 'pin': pin}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'token': data['access_token'] ?? data['token'] ?? 'mock_jwt_token',
          'role': data['user']?['role'] ?? data['role'] ?? 'mock_role',
          'isFirstLogin': data['user']?['isFirstLogin'] ?? false,
        };
      } else if (response.statusCode == 401) {
        throw InvalidCredentialsException();
      } else {
        throw AuthException('Failed to login. Server responded with: ${response.statusCode}');
      }
    } on SocketException {
      throw NetworkException();
    } catch (e) {
      if (e is AuthException) rethrow;
      // For http.Client network errors that are not SocketException
      throw NetworkException();
    }
  }
  Future<void> register({
    required String name,
    required String employeeId,
    required String pin,
  }) async {
    try {
      final response = await client.post(
        Uri.parse('$_baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'employeeId': employeeId,
          'pin': pin,
        }),
      );

      if (response.statusCode != 201 && response.statusCode != 200) {
        final body = jsonDecode(response.body);
        throw AuthException(body['message'] ?? 'Failed to register');
      }
    } on SocketException {
      throw NetworkException();
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('Failed to register. Please try again.');
    }
  }

  Future<void> resetPassword(String employeeId, String oldPin, String newPin) async {
    try {
      final response = await client.post(
        Uri.parse('$_baseUrl/auth/employee/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'employeeId': employeeId,
          'oldPin': oldPin,
          'newPin': newPin,
        }),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        final body = jsonDecode(response.body);
        throw AuthException(body['message'] ?? 'Failed to reset password');
      }
    } on SocketException {
      throw NetworkException();
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('Failed to reset password. Please try again.');
    }
  }
}
