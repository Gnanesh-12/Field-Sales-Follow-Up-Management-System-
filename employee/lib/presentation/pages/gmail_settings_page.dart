import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../providers/email_provider.dart';

/// Gmail Settings Page — allows employees to connect/disconnect their Gmail account.
///
/// Accessible from: Profile → Email / Gmail Settings
class GmailSettingsPage extends ConsumerStatefulWidget {
  const GmailSettingsPage({super.key});

  @override
  ConsumerState<GmailSettingsPage> createState() => _GmailSettingsPageState();
}

class _GmailSettingsPageState extends ConsumerState<GmailSettingsPage> {
  bool _isConnecting = false;
  bool _isDisconnecting = false;

  Future<void> _connectGmail() async {
    setState(() => _isConnecting = true);
    try {
      final authUrl = await ref.read(emailRepositoryProvider).getGmailAuthUrl();
      final uri = Uri.parse(authUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open browser for Gmail connection.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isConnecting = false);
    }
  }

  Future<void> _disconnectGmail() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ctx.surfaceColor,
        title: Text('Disconnect Gmail', style: AppTheme.headingSmall.copyWith(color: ctx.textPrimaryColor)),
        content: Text(
          'Are you sure you want to disconnect your Gmail account? You will not be able to send emails until you reconnect.',
          style: AppTheme.bodyMedium.copyWith(color: ctx.textSecondaryColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: TextStyle(color: ctx.textMutedColor)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Disconnect', style: TextStyle(color: AppTheme.dangerRed)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isDisconnecting = true);
    try {
      await ref.read(emailRepositoryProvider).disconnectGmail();
      ref.invalidate(gmailStatusProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gmail disconnected successfully.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isDisconnecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final gmailStatus = ref.watch(gmailStatusProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('Gmail Settings', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: false,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: context.textSecondaryColor),
            onPressed: () => ref.invalidate(gmailStatusProvider),
          ),
        ],
      ),
      body: gmailStatus.when(
        data: (status) => _buildContent(context, status),
        loading: () => Center(child: CircularProgressIndicator(color: context.accentColor)),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, color: AppTheme.dangerRed, size: 48),
                const SizedBox(height: 16),
                Text('Failed to load Gmail status', style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor)),
                const SizedBox(height: 8),
                Text('$error', style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => ref.invalidate(gmailStatusProvider),
                  style: ElevatedButton.styleFrom(backgroundColor: context.accentColor),
                  child: const Text('Retry', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, dynamic status) {
    final isConnected = status.connected == true;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Status Card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isConnected
                  ? [AppTheme.successGreen.withValues(alpha: 0.1), AppTheme.successGreen.withValues(alpha: 0.05)]
                  : [Colors.grey.withValues(alpha: 0.1), Colors.grey.withValues(alpha: 0.05)],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isConnected
                  ? AppTheme.successGreen.withValues(alpha: 0.3)
                  : context.borderSubtleColor,
            ),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isConnected
                      ? AppTheme.successGreen.withValues(alpha: 0.15)
                      : Colors.grey.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isConnected ? Icons.check_circle_rounded : Icons.mail_outline,
                  size: 40,
                  color: isConnected ? AppTheme.successGreen : context.textMutedColor,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                isConnected ? 'Gmail Connected' : 'Gmail Not Connected',
                style: AppTheme.headingSmall.copyWith(
                  color: isConnected ? AppTheme.successGreen : context.textPrimaryColor,
                ),
              ),
              if (isConnected && status.gmailAddress != null) ...[
                const SizedBox(height: 8),
                Text(
                  status.gmailAddress,
                  style: AppTheme.bodyLarge.copyWith(color: context.textSecondaryColor),
                ),
              ],
              if (isConnected && status.connectedAt != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Connected on ${DateFormat('MMM d, yyyy').format(status.connectedAt)}',
                  style: AppTheme.bodySmall.copyWith(color: context.textMutedColor),
                ),
              ],
              if (!isConnected) ...[
                const SizedBox(height: 8),
                Text(
                  'Connect your Gmail to send emails directly from Kshetra.',
                  style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Action Button
        if (isConnected)
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              icon: _isDisconnecting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.dangerRed))
                  : const Icon(Icons.link_off_rounded, color: AppTheme.dangerRed),
              label: Text(
                _isDisconnecting ? 'Disconnecting...' : 'Disconnect Gmail',
                style: AppTheme.buttonText.copyWith(color: AppTheme.dangerRed),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.dangerRed.withValues(alpha: 0.08),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppTheme.dangerRed),
                ),
                elevation: 0,
              ),
              onPressed: _isDisconnecting ? null : _disconnectGmail,
            ),
          )
        else
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              icon: _isConnecting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.link_rounded, color: Colors.white),
              label: Text(
                _isConnecting ? 'Opening Browser...' : 'Connect Gmail',
                style: AppTheme.buttonText.copyWith(color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4285F4), // Google Blue
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: _isConnecting ? null : _connectGmail,
            ),
          ),

        const SizedBox(height: 32),

        // Info Section
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.surfaceColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.borderSubtleColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.info_outline, size: 18, color: context.textSecondaryColor),
                  const SizedBox(width: 8),
                  Text('How it works', style: AppTheme.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: context.textPrimaryColor)),
                ],
              ),
              const SizedBox(height: 12),
              _buildInfoRow(context, '1', 'Connect your existing Gmail account securely via Google OAuth.'),
              const SizedBox(height: 8),
              _buildInfoRow(context, '2', 'Kshetra will only request permission to send emails on your behalf.'),
              const SizedBox(height: 8),
              _buildInfoRow(context, '3', 'Your Gmail password is never stored or accessed by Kshetra.'),
              const SizedBox(height: 8),
              _buildInfoRow(context, '4', 'You can disconnect at any time from this page.'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(BuildContext context, String number, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: context.accentColor.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(number, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.accentColor)),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text, style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor)),
        ),
      ],
    );
  }
}
