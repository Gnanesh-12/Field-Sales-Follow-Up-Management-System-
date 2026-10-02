import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../app_theme.dart';
import '../providers/email_provider.dart';

/// Email Composer Page — allows employees to compose and send emails to customers.
///
/// Can be opened from:
/// - Customer profile → Send Email
/// - Field Visit detail → Email Visit Report (with pre-filled data)
class EmailComposerPage extends ConsumerStatefulWidget {
  /// Pre-filled recipient email (from customer profile).
  final String? recipientEmail;

  /// Pre-filled recipient name (for display).
  final String? recipientName;

  /// Customer site ID to link the email to the customer.
  final String? customerSiteId;

  /// Pre-filled subject line.
  final String? initialSubject;

  /// Pre-filled email body.
  final String? initialBody;

  /// URLs of attachments to include (e.g. visit photos from Vercel Blob).
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
  ConsumerState<EmailComposerPage> createState() => _EmailComposerPageState();
}

class _EmailComposerPageState extends ConsumerState<EmailComposerPage> {
  late final TextEditingController _toController;
  late final TextEditingController _ccController;
  late final TextEditingController _subjectController;
  late final TextEditingController _bodyController;
  bool _isSending = false;
  final List<String> _attachmentUrls = [];

  @override
  void initState() {
    super.initState();
    _toController = TextEditingController(text: widget.recipientEmail ?? '');
    _ccController = TextEditingController();
    _subjectController = TextEditingController(text: widget.initialSubject ?? '');
    _bodyController = TextEditingController(text: widget.initialBody ?? '');
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

  Future<void> _sendEmail() async {
    final to = _toController.text.trim();
    final subject = _subjectController.text.trim();
    final body = _bodyController.text.trim();

    if (to.isEmpty) {
      _showError('Please enter a recipient email address.');
      return;
    }
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(to)) {
      _showError('Please enter a valid email address.');
      return;
    }
    if (subject.isEmpty) {
      _showError('Please enter a subject.');
      return;
    }
    if (body.isEmpty) {
      _showError('Please enter a message body.');
      return;
    }

    // Parse CC emails
    List<String>? ccList;
    final ccText = _ccController.text.trim();
    if (ccText.isNotEmpty) {
      ccList = ccText.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      for (final cc in ccList) {
        if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(cc)) {
          _showError('Invalid CC email: $cc');
          return;
        }
      }
    }

    setState(() => _isSending = true);

    try {
      final result = await ref.read(emailRepositoryProvider).sendEmail(
        to: to,
        cc: ccList,
        subject: subject,
        body: body,
        customerSiteId: widget.customerSiteId,
        attachmentUrls: _attachmentUrls.isNotEmpty ? _attachmentUrls : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.status == 'SENT' ? 'Email sent successfully!' : 'Email queued for sending.'),
            backgroundColor: AppTheme.successGreen,
          ),
        );
        Navigator.pop(context, true); // Return true to indicate email was sent
      }
    } catch (e) {
      if (mounted) {
        _showError('$e');
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppTheme.dangerRed),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('Compose Email', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: false,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton.icon(
              icon: _isSending
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send_rounded, size: 18),
              label: Text(_isSending ? 'Sending...' : 'Send'),
              onPressed: _isSending ? null : _sendEmail,
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: _isSending ? Colors.grey : context.accentColor,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Recipient info (if from customer)
            if (widget.recipientName != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.accentColor.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.business, size: 18, color: context.accentColor),
                    const SizedBox(width: 8),
                    Text(widget.recipientName!, style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: context.textPrimaryColor)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // To field
            _buildFieldLabel(context, 'To'),
            const SizedBox(height: 6),
            TextField(
              controller: _toController,
              keyboardType: TextInputType.emailAddress,
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              decoration: _inputDecoration(context, 'recipient@example.com'),
            ),
            const SizedBox(height: 16),

            // CC field
            _buildFieldLabel(context, 'CC (comma separated)'),
            const SizedBox(height: 6),
            TextField(
              controller: _ccController,
              keyboardType: TextInputType.emailAddress,
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              decoration: _inputDecoration(context, 'cc1@example.com, cc2@example.com'),
            ),
            const SizedBox(height: 16),

            // Subject field
            _buildFieldLabel(context, 'Subject'),
            const SizedBox(height: 6),
            TextField(
              controller: _subjectController,
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              decoration: _inputDecoration(context, 'Email subject'),
            ),
            const SizedBox(height: 16),

            // Body field
            _buildFieldLabel(context, 'Message'),
            const SizedBox(height: 6),
            TextField(
              controller: _bodyController,
              maxLines: 10,
              minLines: 5,
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              decoration: _inputDecoration(context, 'Type your message here...'),
            ),
            const SizedBox(height: 16),

            // Attachments section
            if (_attachmentUrls.isNotEmpty) ...[
              _buildFieldLabel(context, 'Attachments'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _attachmentUrls.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final url = entry.value;
                  final filename = Uri.parse(url).pathSegments.isNotEmpty
                      ? Uri.parse(url).pathSegments.last
                      : 'attachment-${idx + 1}';
                  return Chip(
                    avatar: const Icon(Icons.attach_file, size: 16),
                    label: Text(
                      filename.length > 25 ? '${filename.substring(0, 25)}...' : filename,
                      style: AppTheme.bodySmall.copyWith(color: context.textPrimaryColor),
                    ),
                    deleteIcon: const Icon(Icons.close, size: 16),
                    onDeleted: () => setState(() => _attachmentUrls.removeAt(idx)),
                    backgroundColor: context.surfaceColor,
                    side: BorderSide(color: context.borderSubtleColor),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFieldLabel(BuildContext context, String label) {
    return Text(
      label,
      style: AppTheme.bodySmall.copyWith(
        fontWeight: FontWeight.w600,
        color: context.textSecondaryColor,
        letterSpacing: 0.5,
      ),
    );
  }

  InputDecoration _inputDecoration(BuildContext context, String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: AppTheme.bodyMedium.copyWith(color: context.textMutedColor),
      filled: true,
      fillColor: context.surfaceColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: context.borderSubtleColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: context.borderSubtleColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: context.accentColor, width: 1.5),
      ),
    );
  }
}
