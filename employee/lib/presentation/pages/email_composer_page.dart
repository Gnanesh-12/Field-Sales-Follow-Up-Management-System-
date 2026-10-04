import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../app_theme.dart';
import '../providers/email_provider.dart';

/// Email Composer Page.
///
/// Supports:
/// - Sending email to a customer
/// - CC recipients
/// - Customer-site association
/// - Multiple attachments
/// - Attachment upload to the backend
/// - 10 MB per-file attachment limit
/// - Existing visit-report attachments
class EmailComposerPage extends ConsumerStatefulWidget {
  /// Pre-filled recipient email.
  final String? recipientEmail;

  /// Pre-filled recipient name.
  final String? recipientName;

  /// Customer site ID associated with this email.
  final String? customerSiteId;

  /// Pre-filled subject.
  final String? initialSubject;

  /// Pre-filled body.
  final String? initialBody;

  /// Existing attachment URLs.
  ///
  /// These can be supplied when opening the composer from
  /// another page, such as a field-visit report.
  final List<String>? attachmentUrls;

  const EmailComposerPage({
    super.key,
    this.recipientEmail,
    this.recipientName,
    this.customerSiteId,
    this.initialSubject,
    this.initialBody,
    this.attachmentUrls,
  });

  @override
  ConsumerState<EmailComposerPage> createState() =>
      _EmailComposerPageState();
}

class _EmailComposerPageState
    extends ConsumerState<EmailComposerPage> {
  late final TextEditingController _toController;
  late final TextEditingController _ccController;
  late final TextEditingController _subjectController;
  late final TextEditingController _bodyController;

  bool _isSending = false;
  bool _uploadingAttachment = false;

  final List<String> _attachmentUrls = [];

  static const int _maxAttachmentSize = 10 * 1024 * 1024;

  static const List<String> _allowedExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
  ];

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

    throw Exception(
      'API_URL is not configured for production environment.',
    );
  }

  @override
  void initState() {
    super.initState();

    _toController = TextEditingController(
      text: widget.recipientEmail ?? '',
    );

    _ccController = TextEditingController();

    _subjectController = TextEditingController(
      text: widget.initialSubject ?? '',
    );

    _bodyController = TextEditingController(
      text: widget.initialBody ?? '',
    );

    if (widget.attachmentUrls != null) {
      _attachmentUrls.addAll(widget.attachmentUrls!);
    }
  }

  @override
  void dispose() {
    _toController.dispose();
    _ccController.dispose();
    _subjectController.dispose();
    _bodyController.dispose();

    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // EMAIL VALIDATION
  // ---------------------------------------------------------------------------

  bool _isValidEmail(String email) {
    return RegExp(
      r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
    ).hasMatch(email);
  }

  List<String>? _parseCcEmails() {
    final ccText = _ccController.text.trim();

    if (ccText.isEmpty) {
      return null;
    }

    final ccList = ccText
        .split(',')
        .map((email) => email.trim())
        .where((email) => email.isNotEmpty)
        .toList();

    for (final email in ccList) {
      if (!_isValidEmail(email)) {
        _showError('Invalid CC email: $email');
        return null;
      }
    }

    return ccList;
  }

  // ---------------------------------------------------------------------------
  // SEND EMAIL
  // ---------------------------------------------------------------------------

  Future<void> _sendEmail() async {
    if (_isSending || _uploadingAttachment) {
      return;
    }

    final to = _toController.text.trim();
    final subject = _subjectController.text.trim();
    final body = _bodyController.text.trim();

    if (to.isEmpty) {
      _showError(
        'Please enter a recipient email address.',
      );
      return;
    }

    if (!_isValidEmail(to)) {
      _showError(
        'Please enter a valid email address.',
      );
      return;
    }

    final ccList = _parseCcEmails();

    if (_ccController.text.trim().isNotEmpty &&
        ccList == null) {
      return;
    }

    if (subject.isEmpty) {
      _showError(
        'Please enter a subject.',
      );
      return;
    }

    if (body.isEmpty) {
      _showError(
        'Please enter a message body.',
      );
      return;
    }

    setState(() {
      _isSending = true;
    });

    try {
      final result =
          await ref.read(emailRepositoryProvider).sendEmail(
                to: to,
                cc: ccList,
                subject: subject,
                body: body,
                customerSiteId: widget.customerSiteId,
                attachmentUrls:
                    _attachmentUrls.isNotEmpty
                        ? List<String>.from(_attachmentUrls)
                        : null,
              );

      if (!mounted) {
        return;
      }

      final isSent = result.status.toUpperCase() == 'SENT';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isSent
                ? 'Email sent successfully!'
                : 'Email queued for sending.',
          ),
          backgroundColor: AppTheme.successGreen,
        ),
      );

      Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        _showError(
          _cleanExceptionMessage(error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // ATTACHMENTS
  // ---------------------------------------------------------------------------

  Future<void> _pickAttachments() async {
    if (_uploadingAttachment || _isSending) {
      return;
    }

    try {
      /*
       * file_picker 13.x:
       *
       * - pickFiles() now returns List<PlatformFile>
       * - allowMultiple was removed
       * - multiple selection is the default
       */
      final files = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: _allowedExtensions,
      );

      if (files.isEmpty) {
        return;
      }

      if (!mounted) {
        return;
      }

      setState(() {
        _uploadingAttachment = true;
      });

      final storage = const FlutterSecureStorage();

      final token = await storage.read(
        key: 'jwt_token',
      );

      for (final file in files) {
        if (!mounted) {
          return;
        }

        final length = await file.length();

        if (length == null) {
          throw Exception(
            'Unable to determine the size of ${file.name}.',
          );
        }

        if (length > _maxAttachmentSize) {
          throw Exception(
            '${file.name} is larger than 10 MB.',
          );
        }

        final bytes = await file.readAsBytes();

        final request = http.MultipartRequest(
          'POST',
          Uri.parse(
            '$_baseUrl/uploads/attachment',
          ),
        );

        if (token != null && token.isNotEmpty) {
          request.headers['Authorization'] =
              'Bearer $token';
        }

        request.files.add(
          http.MultipartFile.fromBytes(
            'file',
            bytes,
            filename: file.name,
          ),
        );

        final streamedResponse =
            await request.send();

        final response =
            await http.Response.fromStream(
          streamedResponse,
        );

        if (response.statusCode < 200 ||
            response.statusCode >= 300) {
          throw Exception(
            _parseUploadError(
              response,
              file.name,
            ),
          );
        }

        final decoded = jsonDecode(
          response.body,
        );

        if (decoded is! Map) {
          throw Exception(
            'Invalid upload response for ${file.name}.',
          );
        }

        final url = decoded['url']?.toString();

        if (url == null || url.isEmpty) {
          throw Exception(
            'The server did not return a URL for ${file.name}.',
          );
        }

        if (!mounted) {
          return;
        }

        setState(() {
          _attachmentUrls.add(url);
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              files.length == 1
                  ? 'Attachment uploaded successfully.'
                  : '${files.length} attachments uploaded successfully.',
            ),
            backgroundColor: AppTheme.successGreen,
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        _showError(
          'Attachment upload failed: ${_cleanExceptionMessage(error)}',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _uploadingAttachment = false;
        });
      }
    }
  }

  String _parseUploadError(
    http.Response response,
    String filename,
  ) {
    try {
      final decoded = jsonDecode(
        response.body,
      );

      if (decoded is Map &&
          decoded['message'] != null) {
        final message = decoded['message'];

        if (message is List) {
          return message.join(', ');
        }

        return message.toString();
      }
    } catch (_) {
      // Fall back to the generic message below.
    }

    return 'Upload failed for $filename '
        '(HTTP ${response.statusCode}).';
  }

  void _removeAttachment(int index) {
    if (index < 0 ||
        index >= _attachmentUrls.length) {
      return;
    }

    setState(() {
      _attachmentUrls.removeAt(index);
    });
  }

  String _attachmentFileName(
    String url,
    int index,
  ) {
    try {
      final uri = Uri.parse(url);

      if (uri.pathSegments.isNotEmpty) {
        final name = uri.pathSegments.last;

        if (name.isNotEmpty) {
          return Uri.decodeComponent(name);
        }
      }
    } catch (_) {
      // Fall through to the generated name.
    }

    return 'attachment-${index + 1}';
  }

  // ---------------------------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------------------------

  void _showError(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.dangerRed,
      ),
    );
  }

  String _cleanExceptionMessage(
    Object error,
  ) {
    final message = error.toString();

    if (message.startsWith('Exception: ')) {
      return message.substring(
        'Exception: '.length,
      );
    }

    return message;
  }

  Widget _buildFieldLabel(
    BuildContext context,
    String label,
  ) {
    return Text(
      label,
      style: AppTheme.bodySmall.copyWith(
        fontWeight: FontWeight.w600,
        color: context.textSecondaryColor,
        letterSpacing: 0.5,
      ),
    );
  }

  InputDecoration _inputDecoration(
    BuildContext context,
    String hint,
  ) {
    return InputDecoration(
      hintText: hint,
      hintStyle: AppTheme.bodyMedium.copyWith(
        color: context.textMutedColor,
      ),
      filled: true,
      fillColor: context.surfaceColor,
      contentPadding:
          const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 14,
      ),
      border: OutlineInputBorder(
        borderRadius:
            BorderRadius.circular(10),
        borderSide: BorderSide(
          color: context.borderSubtleColor,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius:
            BorderRadius.circular(10),
        borderSide: BorderSide(
          color: context.borderSubtleColor,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius:
            BorderRadius.circular(10),
        borderSide: BorderSide(
          color: context.accentColor,
          width: 1.5,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // BUILD
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor:
          context.backgroundColor,

      appBar: AppBar(
        backgroundColor:
            context.surfaceColor,
        title: Text(
          'Compose Email',
          style:
              AppTheme.headingSmall.copyWith(
            color:
                context.textPrimaryColor,
          ),
        ),
        centerTitle: false,
        elevation: 0,
        actions: [
          Padding(
            padding:
                const EdgeInsets.only(
              right: 8,
            ),
            child: TextButton.icon(
              icon: _isSending
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child:
                          CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(
                      Icons.send_rounded,
                      size: 18,
                    ),
              label: Text(
                _isSending
                    ? 'Sending...'
                    : 'Send',
              ),
              onPressed:
                  _isSending ||
                          _uploadingAttachment
                      ? null
                      : _sendEmail,
              style:
                  TextButton.styleFrom(
                foregroundColor:
                    Colors.white,
                backgroundColor:
                    _isSending ||
                            _uploadingAttachment
                        ? Colors.grey
                        : context.accentColor,
                padding:
                    const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                shape:
                    RoundedRectangleBorder(
                  borderRadius:
                      BorderRadius.circular(
                    8,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),

      body: SingleChildScrollView(
        padding:
            const EdgeInsets.all(20),

        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.stretch,
          children: [
            // -----------------------------------------------------------------
            // CUSTOMER INFORMATION
            // -----------------------------------------------------------------

            if (widget.recipientName !=
                null) ...[
              Container(
                padding:
                    const EdgeInsets.all(12),
                decoration:
                    BoxDecoration(
                  color: context.accentColor
                      .withValues(
                    alpha: 0.08,
                  ),
                  borderRadius:
                      BorderRadius.circular(
                    8,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.business,
                      size: 18,
                      color:
                          context.accentColor,
                    ),
                    const SizedBox(
                      width: 8,
                    ),
                    Expanded(
                      child: Text(
                        widget
                            .recipientName!,
                        style: AppTheme
                            .bodyMedium
                            .copyWith(
                          fontWeight:
                              FontWeight.w600,
                          color: context
                              .textPrimaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(
                height: 16,
              ),
            ],

            // -----------------------------------------------------------------
            // TO
            // -----------------------------------------------------------------

            _buildFieldLabel(
              context,
              'To',
            ),

            const SizedBox(
              height: 6,
            ),

            TextField(
              controller:
                  _toController,
              keyboardType:
                  TextInputType.emailAddress,
              style: AppTheme.bodyLarge
                  .copyWith(
                color:
                    context.textPrimaryColor,
              ),
              decoration:
                  _inputDecoration(
                context,
                'recipient@example.com',
              ),
            ),

            const SizedBox(
              height: 16,
            ),

            // -----------------------------------------------------------------
            // CC
            // -----------------------------------------------------------------

            _buildFieldLabel(
              context,
              'CC (comma separated)',
            ),

            const SizedBox(
              height: 6,
            ),

            TextField(
              controller:
                  _ccController,
              keyboardType:
                  TextInputType.emailAddress,
              style: AppTheme.bodyLarge
                  .copyWith(
                color:
                    context.textPrimaryColor,
              ),
              decoration:
                  _inputDecoration(
                context,
                'cc1@example.com, cc2@example.com',
              ),
            ),

            const SizedBox(
              height: 16,
            ),

            // -----------------------------------------------------------------
            // SUBJECT
            // -----------------------------------------------------------------

            _buildFieldLabel(
              context,
              'Subject',
            ),

            const SizedBox(
              height: 6,
            ),

            TextField(
              controller:
                  _subjectController,
              style: AppTheme.bodyLarge
                  .copyWith(
                color:
                    context.textPrimaryColor,
              ),
              decoration:
                  _inputDecoration(
                context,
                'Email subject',
              ),
            ),

            const SizedBox(
              height: 16,
            ),

            // -----------------------------------------------------------------
            // MESSAGE
            // -----------------------------------------------------------------

            _buildFieldLabel(
              context,
              'Message',
            ),

            const SizedBox(
              height: 6,
            ),

            TextField(
              controller:
                  _bodyController,
              maxLines: 10,
              minLines: 5,
              keyboardType:
                  TextInputType.multiline,
              style: AppTheme.bodyLarge
                  .copyWith(
                color:
                    context.textPrimaryColor,
              ),
              decoration:
                  _inputDecoration(
                context,
                'Type your message here...',
              ),
            ),

            const SizedBox(
              height: 16,
            ),

            // -----------------------------------------------------------------
            // ATTACH FILE BUTTON
            // -----------------------------------------------------------------

            Align(
              alignment:
                  Alignment.centerLeft,
              child:
                  OutlinedButton.icon(
                onPressed:
                    _isSending ||
                            _uploadingAttachment
                        ? null
                        : _pickAttachments,
                icon:
                    _uploadingAttachment
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child:
                                CircularProgressIndicator(
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(
                            Icons.attach_file,
                          ),
                label: Text(
                  _uploadingAttachment
                      ? 'Uploading...'
                      : 'Attach files',
                ),
                style:
                    OutlinedButton.styleFrom(
                  padding:
                      const EdgeInsets
                          .symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  side: BorderSide(
                    color:
                        context.borderSubtleColor,
                  ),
                  foregroundColor:
                      context.textPrimaryColor,
                  shape:
                      RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(
                      8,
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(
              height: 8,
            ),

            Text(
              'PDF, Word, Excel and image files. '
              'Maximum 10 MB per file.',
              style:
                  AppTheme.bodySmall
                      .copyWith(
                color:
                    context.textMutedColor,
              ),
            ),

            const SizedBox(
              height: 16,
            ),

            // -----------------------------------------------------------------
            // ATTACHMENTS
            // -----------------------------------------------------------------

            if (_attachmentUrls.isNotEmpty) ...[
              _buildFieldLabel(
                context,
                'Attachments',
              ),

              const SizedBox(
                height: 8,
              ),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _attachmentUrls
                    .asMap()
                    .entries
                    .map(
                  (entry) {
                    final index =
                        entry.key;

                    final url =
                        entry.value;

                    final filename =
                        _attachmentFileName(
                      url,
                      index,
                    );

                    final displayName =
                        filename.length >
                                25
                            ? '${filename.substring(0, 25)}...'
                            : filename;

                    return Chip(
                      avatar:
                          const Icon(
                        Icons.attach_file,
                        size: 16,
                      ),
                      label: Text(
                        displayName,
                        style: AppTheme
                            .bodySmall
                            .copyWith(
                          color: context
                              .textPrimaryColor,
                        ),
                      ),
                      deleteIcon:
                          const Icon(
                        Icons.close,
                        size: 16,
                      ),
                      onDeleted:
                          _isSending ||
                                  _uploadingAttachment
                              ? null
                              : () =>
                                  _removeAttachment(
                                    index,
                                  ),
                      backgroundColor:
                          context.surfaceColor,
                      side: BorderSide(
                        color: context
                            .borderSubtleColor,
                      ),
                    );
                  },
                ).toList(),
              ),

              const SizedBox(
                height: 16,
              ),
            ],

            // -----------------------------------------------------------------
            // ATTACHMENT COUNT
            // -----------------------------------------------------------------

            if (_attachmentUrls.isNotEmpty)
              Container(
                padding:
                    const EdgeInsets.all(12),
                decoration:
                    BoxDecoration(
                  color: context.accentColor
                      .withValues(
                    alpha: 0.06,
                  ),
                  borderRadius:
                      BorderRadius.circular(
                    8,
                  ),
                  border: Border.all(
                    color: context
                        .borderSubtleColor,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.attach_file,
                      size: 18,
                      color:
                          context.accentColor,
                    ),
                    const SizedBox(
                      width: 8,
                    ),
                    Expanded(
                      child: Text(
                        '${_attachmentUrls.length} '
                        '${_attachmentUrls.length == 1 ? 'attachment' : 'attachments'} '
                        'will be included with this email.',
                        style: AppTheme
                            .bodySmall
                            .copyWith(
                          color: context
                              .textSecondaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}