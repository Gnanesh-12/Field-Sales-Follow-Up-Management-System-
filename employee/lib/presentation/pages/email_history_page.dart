import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../providers/email_provider.dart';
import '../../data/models/email_models.dart';

/// Email History Page — shows the employee's sent email history.
///
/// Accessible from: Profile → Email History
class EmailHistoryPage extends ConsumerStatefulWidget {
  const EmailHistoryPage({super.key});

  @override
  ConsumerState<EmailHistoryPage> createState() => _EmailHistoryPageState();
}

class _EmailHistoryPageState extends ConsumerState<EmailHistoryPage> {
  int _currentPage = 1;

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(emailHistoryProvider(_currentPage));

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('Email History', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: false,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: context.textSecondaryColor),
            onPressed: () => ref.invalidate(emailHistoryProvider(_currentPage)),
          ),
        ],
      ),
      body: historyAsync.when(
        data: (data) {
          final emails = data['emails'] as List<EmailLogEntry>;
          final total = data['total'] as int;

          if (emails.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.email_outlined, size: 64, color: context.textMutedColor),
                  const SizedBox(height: 16),
                  Text('No emails sent yet', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
                  const SizedBox(height: 8),
                  Text(
                    'Emails you send through Kshetra will appear here.',
                    style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: emails.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) => _buildEmailCard(context, emails[index]),
                ),
              ),
              // Pagination
              if (total > 20)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                  decoration: BoxDecoration(
                    color: context.surfaceColor,
                    border: Border(top: BorderSide(color: context.borderSubtleColor)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton.icon(
                        icon: const Icon(Icons.chevron_left, size: 18),
                        label: const Text('Previous'),
                        onPressed: _currentPage > 1
                            ? () => setState(() => _currentPage--)
                            : null,
                      ),
                      Text(
                        'Page $_currentPage',
                        style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.chevron_right, size: 18),
                        label: const Text('Next'),
                        onPressed: emails.length == 20
                            ? () => setState(() => _currentPage++)
                            : null,
                      ),
                    ],
                  ),
                ),
            ],
          );
        },
        loading: () => Center(child: CircularProgressIndicator(color: context.accentColor)),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppTheme.dangerRed, size: 48),
              const SizedBox(height: 16),
              Text('Failed to load email history', style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(emailHistoryProvider(_currentPage)),
                style: ElevatedButton.styleFrom(backgroundColor: context.accentColor),
                child: const Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmailCard(BuildContext context, EmailLogEntry email) {
    final statusColor = switch (email.status) {
      'SENT' => AppTheme.successGreen,
      'FAILED' => AppTheme.dangerRed,
      'QUEUED' => AppTheme.warningOrange,
      _ => context.textMutedColor,
    };

    final statusIcon = switch (email.status) {
      'SENT' => Icons.check_circle_outline,
      'FAILED' => Icons.error_outline,
      'QUEUED' => Icons.schedule,
      _ => Icons.help_outline,
    };

    return Container(
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
              Expanded(
                child: Text(
                  email.subject,
                  style: AppTheme.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                    color: context.textPrimaryColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, size: 12, color: statusColor),
                    const SizedBox(width: 4),
                    Text(
                      email.status,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.person_outline, size: 14, color: context.textMutedColor),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  email.recipientEmail,
                  style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (email.customerSiteName != null) ...[
                Icon(Icons.business_outlined, size: 14, color: context.textMutedColor),
                const SizedBox(width: 4),
                Text(
                  email.customerSiteName!,
                  style: AppTheme.bodySmall.copyWith(color: context.textMutedColor),
                ),
                const Spacer(),
              ] else
                const Spacer(),
              if (email.isVisitReport) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Visit Report',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (email.attachmentCount > 0) ...[
                Icon(Icons.attach_file, size: 12, color: context.textMutedColor),
                Text('${email.attachmentCount}', style: AppTheme.bodySmall.copyWith(color: context.textMutedColor)),
                const SizedBox(width: 8),
              ],
              Text(
                DateFormat('MMM d, h:mm a').format(email.sentAt ?? email.createdAt),
                style: AppTheme.bodySmall.copyWith(color: context.textMutedColor),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
