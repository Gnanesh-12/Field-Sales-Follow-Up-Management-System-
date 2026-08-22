import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import 'package:flutter/foundation.dart';

// IMPORTANT: update with your machine's IP or 10.0.2.2 for Android emulator
final String _baseUrl = kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

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
          'token': data['token'] ?? 'mock_jwt_token',
          'role': data['role'] ?? 'mock_role',
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
}
