import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'models/email_models.dart';

String get _baseUrl {
  if (const bool.hasEnvironment('API_URL')) {
    return const String.fromEnvironment(
      'API_URL',
    );
  }

  if (kDebugMode) {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:3000';
    }

    return 'http://localhost:3000';
  }

  throw Exception(
    'API_URL is not configured for production environment',
  );
}

class EmailRepository {
  final http.Client client;
  final FlutterSecureStorage storage;

  EmailRepository({
    http.Client? client,
    FlutterSecureStorage? storage,
  })  : client =
            client ?? http.Client(),
        storage =
            storage ??
                const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final token =
        await storage.read(
      key: 'jwt_token',
    );

    return {
      'Content-Type':
          'application/json',

      if (token != null)
        'Authorization':
            'Bearer $token',
    };
  }

  Future<String> getGmailAuthUrl() async {
    final response =
        await client.get(
      Uri.parse(
        '$_baseUrl/email/gmail/auth-url',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
        200) {
      final data =
          jsonDecode(
        response.body,
      );

      return data['authUrl']
          .toString();
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<GmailConnectionStatus>
      getGmailStatus() async {
    final response =
        await client.get(
      Uri.parse(
        '$_baseUrl/email/gmail/status',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
        200) {
      return GmailConnectionStatus
          .fromJson(
        Map<String, dynamic>.from(
          jsonDecode(
            response.body,
          ),
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<void> disconnectGmail() async {
    final response =
        await client.delete(
      Uri.parse(
        '$_baseUrl/email/gmail/disconnect',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode !=
            200 &&
        response.statusCode !=
            204) {
      throw Exception(
        _parseError(response),
      );
    }
  }

  Future<SendEmailResult> sendEmail({
    required String to,
    List<String>? cc,
    required String subject,
    required String body,
    String? customerSiteId,
    List<String>? attachmentUrls,
  }) async {
    final response =
        await client.post(
      Uri.parse(
        '$_baseUrl/email/send',
      ),
      headers:
          await _getHeaders(),
      body: jsonEncode({
        'to':
            to,

        if (cc != null &&
            cc.isNotEmpty)
          'cc':
              cc,

        'subject':
            subject,

        'body':
            body,

        if (customerSiteId !=
            null)
          'customerSiteId':
              customerSiteId,

        if (attachmentUrls !=
                null &&
            attachmentUrls
                .isNotEmpty)
          'attachmentUrls':
              attachmentUrls,
      }),
    );

    if (response.statusCode ==
            200 ||
        response.statusCode ==
            201) {
      final data =
          jsonDecode(
        response.body,
      );

      return SendEmailResult.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<SendEmailResult>
      sendVisitReport({
    required String fieldVisitId,
    required String recipientEmail,
    List<String>? cc,
    String? additionalNotes,
    bool includePhotos = true,
  }) async {
    final response =
        await client.post(
      Uri.parse(
        '$_baseUrl/email/send-visit-report',
      ),
      headers:
          await _getHeaders(),
      body: jsonEncode({
        'fieldVisitId':
            fieldVisitId,

        'recipientEmail':
            recipientEmail,

        if (cc != null &&
            cc.isNotEmpty)
          'cc':
              cc,

        if (additionalNotes !=
            null)
          'additionalNotes':
              additionalNotes,

        'includePhotos':
            includePhotos,
      }),
    );

    if (response.statusCode ==
            200 ||
        response.statusCode ==
            201) {
      final data =
          jsonDecode(
        response.body,
      );

      return SendEmailResult.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  /**
   * Upload a generic email attachment.
   */
  Future<Map<String, dynamic>>
      uploadAttachment({
    required String filename,
    required List<int> bytes,
  }) async {
    final token =
        await storage.read(
      key: 'jwt_token',
    );

    final request =
        http.MultipartRequest(
      'POST',
      Uri.parse(
        '$_baseUrl/uploads/attachment',
      ),
    );

    if (token != null) {
      request.headers[
          'Authorization'] =
          'Bearer $token';
    }

    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename:
            filename,
      ),
    );

    final streamed =
        await request.send();

    final response =
        await http.Response.fromStream(
      streamed,
    );

    if (response.statusCode ==
            200 ||
        response.statusCode ==
            201) {
      final decoded =
          jsonDecode(
        response.body,
      );

      return Map<String, dynamic>.from(
        decoded,
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<Map<String, dynamic>>
      getEmailHistory({
    int page = 1,
    int limit = 20,
  }) async {
    final response =
        await client.get(
      Uri.parse(
        '$_baseUrl/email/history?page=$page&limit=$limit',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
        200) {
      final data =
          Map<String, dynamic>.from(
        jsonDecode(
          response.body,
        ),
      );

      return {
        'emails':
            (data['emails']
                    as List? ??
                [])
                .map(
                  (e) =>
                      EmailLogEntry
                          .fromJson(
                    Map<String,
                        dynamic>.from(
                      e,
                    ),
                  ),
                )
                .toList(),

        'total':
            data['total'],
      };
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<EmailDetail>
      getEmailDetail(
    String emailId,
  ) async {
    final response =
        await client.get(
      Uri.parse(
        '$_baseUrl/email/history/$emailId',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
        200) {
      return EmailDetail.fromJson(
        Map<String, dynamic>.from(
          jsonDecode(
            response.body,
          ),
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<Map<String, dynamic>>
      syncInbox() async {
    final response =
        await client.post(
      Uri.parse(
        '$_baseUrl/email/sync',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
            200 ||
        response.statusCode ==
            201) {
      return Map<String, dynamic>.from(
        jsonDecode(
          response.body,
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<Map<String, dynamic>>
      getInbox({
    int page = 1,
    int limit = 30,
    String? customerSiteId,
  }) async {
    final query =
        <String, String>{
      'page':
          page.toString(),

      'limit':
          limit.toString(),

      if (customerSiteId !=
          null)
        'customerSiteId':
            customerSiteId,
    };

    final uri =
        Uri.parse(
      '$_baseUrl/email/inbox',
    ).replace(
      queryParameters:
          query,
    );

    final response =
        await client.get(
      uri,
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
        200) {
      final data =
          Map<String, dynamic>.from(
        jsonDecode(
          response.body,
        ),
      );

      return {
        'threads':
            (data['threads']
                    as List? ??
                [])
                .map(
                  (item) =>
                      EmailThreadModel
                          .fromJson(
                    Map<String,
                        dynamic>.from(
                      item,
                    ),
                  ),
                )
                .toList(),

        'total':
            data['total'],

        'page':
            data['page'],

        'limit':
            data['limit'],
      };
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<EmailConversation>
      getEmailThread(
    String threadId,
  ) async {
    final response =
        await client.get(
      Uri.parse(
        '$_baseUrl/email/threads/$threadId',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
        200) {
      return EmailConversation
          .fromJson(
        Map<String, dynamic>.from(
          jsonDecode(
            response.body,
          ),
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<void> markThreadRead(
    String threadId,
  ) async {
    final response =
        await client.post(
      Uri.parse(
        '$_baseUrl/email/threads/$threadId/read',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode !=
        200) {
      throw Exception(
        _parseError(response),
      );
    }
  }

  Future<SendEmailResult>
      replyToThread({
    required String threadId,
    required String body,
  }) async {
    final response =
        await client.post(
      Uri.parse(
        '$_baseUrl/email/threads/$threadId/reply',
      ),
      headers:
          await _getHeaders(),
      body: jsonEncode({
        'body':
            body,
      }),
    );

    if (response.statusCode ==
            200 ||
        response.statusCode ==
            201) {
      final data =
          jsonDecode(
        response.body,
      );

      return SendEmailResult.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<SendEmailResult>
      forwardMessage({
    required String messageId,
    required String to,
    required String body,
  }) async {
    final response =
        await client.post(
      Uri.parse(
        '$_baseUrl/email/messages/$messageId/forward',
      ),
      headers:
          await _getHeaders(),
      body: jsonEncode({
        'to':
            to,

        'body':
            body,
      }),
    );

    if (response.statusCode ==
            200 ||
        response.statusCode ==
            201) {
      final data =
          jsonDecode(
        response.body,
      );

      return SendEmailResult.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    throw Exception(
      _parseError(response),
    );
  }

  Future<List<EmailReminder>>
      getReminders() async {
    final response =
        await client.get(
      Uri.parse(
        '$_baseUrl/email/reminders',
      ),
      headers:
          await _getHeaders(),
    );

    if (response.statusCode ==
        200) {
      final data =
          jsonDecode(
        response.body,
      );

      return (data as List)
          .map(
            (item) =>
                EmailReminder
                    .fromJson(
              Map<String,
                  dynamic>.from(
                item,
              ),
            ),
          )
          .toList();
    }

    throw Exception(
      _parseError(response),
    );
  }

  String _parseError(
    http.Response response,
  ) {
    try {
      final body =
          jsonDecode(
        response.body,
      );

      if (body is Map &&
          body['message'] !=
              null) {
        if (body['message']
            is List) {
          return (body['message']
                  as List)
              .join(
                ', ',
              );
        }

        return body['message']
            .toString();
      }
    } catch (_) {}

    return 'Request failed (${response.statusCode})';
  }
}