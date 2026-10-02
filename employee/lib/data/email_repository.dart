import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models/email_models.dart';

String get _baseUrl {
  if (const bool.hasEnvironment('API_URL')) {
    return const String.fromEnvironment('API_URL');
  }
  if (kDebugMode) {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }
  throw Exception('API_URL is not configured for production environment');
}

/// Repository for all email-related API calls.
/// Follows the same pattern as ApiRepository.
class EmailRepository {
  final http.Client client;
  final FlutterSecureStorage storage;

  EmailRepository({http.Client? client, FlutterSecureStorage? storage})
      : client = client ?? http.Client(),
        storage = storage ?? const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final token = await storage.read(key: 'jwt_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ─── Gmail Connection ────────────────────────────────────────

  /// Get the Gmail OAuth authorization URL.
  /// The employee should be redirected to this URL to connect their Gmail.
  Future<String> getGmailAuthUrl() async {
    final response = await client.get(
      Uri.parse('$_baseUrl/email/gmail/auth-url'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['authUrl'] as String;
    } else {
      final body = _parseError(response);
      throw Exception(body);
    }
  }

  /// Get the current Gmail connection status.
  Future<GmailConnectionStatus> getGmailStatus() async {
    final response = await client.get(
      Uri.parse('$_baseUrl/email/gmail/status'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return GmailConnectionStatus.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to get Gmail status');
    }
  }

  /// Disconnect Gmail account.
  Future<void> disconnectGmail() async {
    final response = await client.delete(
      Uri.parse('$_baseUrl/email/gmail/disconnect'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to disconnect Gmail');
    }
  }

  // ─── Email Sending ───────────────────────────────────────────

  /// Send an email to a customer.
  Future<SendEmailResult> sendEmail({
    required String to,
    List<String>? cc,
    required String subject,
    required String body,
    String? customerSiteId,
    List<String>? attachmentUrls,
  }) async {
    final response = await client.post(
      Uri.parse('$_baseUrl/email/send'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'to': to,
        if (cc != null && cc.isNotEmpty) 'cc': cc,
        'subject': subject,
        'body': body,
        if (customerSiteId != null) 'customerSiteId': customerSiteId,
        if (attachmentUrls != null && attachmentUrls.isNotEmpty)
          'attachmentUrls': attachmentUrls,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return SendEmailResult.fromJson(jsonDecode(response.body));
    } else {
      final msg = _parseError(response);
      throw Exception(msg);
    }
  }

  /// Send a field visit report email.
  Future<SendEmailResult> sendVisitReport({
    required String fieldVisitId,
    required String recipientEmail,
    List<String>? cc,
    String? additionalNotes,
    bool includePhotos = true,
  }) async {
    final response = await client.post(
      Uri.parse('$_baseUrl/email/send-visit-report'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'fieldVisitId': fieldVisitId,
        'recipientEmail': recipientEmail,
        if (cc != null && cc.isNotEmpty) 'cc': cc,
        if (additionalNotes != null) 'additionalNotes': additionalNotes,
        'includePhotos': includePhotos,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return SendEmailResult.fromJson(jsonDecode(response.body));
    } else {
      final msg = _parseError(response);
      throw Exception(msg);
    }
  }

  // ─── Email History ───────────────────────────────────────────

  /// Get the employee's sent email history.
  Future<Map<String, dynamic>> getEmailHistory({int page = 1, int limit = 20}) async {
    final response = await client.get(
      Uri.parse('$_baseUrl/email/history?page=$page&limit=$limit'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'emails': (data['emails'] as List)
            .map((e) => EmailLogEntry.fromJson(e))
            .toList(),
        'total': data['total'],
      };
    } else {
      throw Exception('Failed to load email history');
    }
  }

  /// Get a single email detail.
  Future<EmailDetail> getEmailDetail(String emailId) async {
    final response = await client.get(
      Uri.parse('$_baseUrl/email/history/$emailId'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return EmailDetail.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load email detail');
    }
  }

  // ─── Helper ──────────────────────────────────────────────────

  String _parseError(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      return body['message'] ?? 'Request failed (${response.statusCode})';
    } catch (_) {
      return 'Request failed (${response.statusCode})';
    }
  }
}
