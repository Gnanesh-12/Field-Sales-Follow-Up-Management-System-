import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../providers/visits_provider.dart';
import '../providers/theme_provider.dart';
import 'visit_detail_page.dart';

class VisitsPage extends ConsumerStatefulWidget {
  const VisitsPage({super.key});

  @override
  ConsumerState<VisitsPage> createState() => _VisitsPageState();
}

class _VisitsPageState extends ConsumerState<VisitsPage> {
  @override
  Widget build(BuildContext context) {
    final visitsAsyncValue = ref.watch(visitsProvider(1)); // First page

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('My Visits', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: false,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(context.isDarkMode ? Icons.light_mode : Icons.dark_mode),
            onPressed: () {
              ref.read(themeProvider.notifier).toggleTheme(context);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(visitsProvider(1)),
        color: AppTheme.primaryBlue,
        backgroundColor: context.surfaceColor,
        child: visitsAsyncValue.when(
          data: (data) {
            final List visits = data['visits'];
            if (visits.isEmpty) {
              return Center(
                child: Text('No field visits logged yet.', style: AppTheme.bodyLarge.copyWith(color: context.textMutedColor)),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: visits.length,
              itemBuilder: (context, index) {
                final visit = visits[index];
                final timeStr = DateFormat('MMM d, yyyy - h:mm a').format(visit.timestamp);
                final bool hasFollowUp = visit.followUps.isNotEmpty;
                final bool isPendingFollowUp = visit.followUps.any((f) => f.status == 'pending');

                // Approval status colors and labels
                final Color statusColor;
                final String statusLabel;
                final IconData statusIcon;
                switch (visit.status) {
                  case 'APPROVED':
                    statusColor = AppTheme.successGreen;
                    statusLabel = 'APPROVED';
                    statusIcon = Icons.check_circle_rounded;
                    break;
                  case 'DENIED':
                  case 'REJECTED':
                    statusColor = AppTheme.dangerRed;
                    statusLabel = 'DENIED';
                    statusIcon = Icons.cancel_rounded;
                    break;
                  default: // PENDING
                    statusColor = AppTheme.warningOrange;
                    statusLabel = 'PENDING';
                    statusIcon = Icons.hourglass_top_rounded;
                }

                return GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (_) => VisitDetailPage(visitId: visit.id),
                    ));
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.surfaceColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: context.borderSubtleColor),
                      boxShadow: AppTheme.subtleShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                visit.site?.name ?? 'Unknown Site',
                                style: AppTheme.headingSmall.copyWith(fontSize: 16, color: context.textPrimaryColor),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            // Approval Status Badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(statusIcon, size: 12, color: statusColor),
                                  const SizedBox(width: 4),
                                  Text(
                                    statusLabel,
                                    style: AppTheme.bodySmall.copyWith(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: statusColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.access_time_rounded, color: context.textSecondaryColor, size: 16),
                            const SizedBox(width: 6),
                            Text(timeStr, style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor)),
                          ],
                        ),
                        if (visit.materials.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.inventory_2_rounded, color: context.textSecondaryColor, size: 16),
                              const SizedBox(width: 6),
                              Text('${visit.materials.length} material(s)', style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor)),
                            ],
                          ),
                        ],
                        if (hasFollowUp) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(
                                Icons.flag,
                                color: isPendingFollowUp ? AppTheme.warningOrange : AppTheme.successGreen,
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                isPendingFollowUp ? 'Follow-up pending' : 'Follow-up completed',
                                style: AppTheme.bodySmall.copyWith(
                                  color: isPendingFollowUp ? AppTheme.warningOrange : AppTheme.successGreen,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
          error: (error, _) => Center(child: Text('Error: $error', style: const TextStyle(color: AppTheme.dangerRed))),
        ),
      ),
    );
  }
}
