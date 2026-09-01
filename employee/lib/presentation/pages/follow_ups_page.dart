import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../providers/follow_ups_provider.dart';
import '../providers/theme_provider.dart';

class FollowUpsPage extends ConsumerStatefulWidget {
  const FollowUpsPage({super.key});

  @override
  ConsumerState<FollowUpsPage> createState() => _FollowUpsPageState();
}

class _FollowUpsPageState extends ConsumerState<FollowUpsPage> {
  String _filter = 'pending';

  @override
  Widget build(BuildContext context) {
    final followUpsAsyncValue = ref.watch(followUpsProvider(_filter));

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('Follow-ups', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
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
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip(context, 'pending', 'Pending Tasks'),
                const SizedBox(width: 12),
                _buildFilterChip(context, 'completed', 'Completed Tasks'),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(followUpsProvider(_filter)),
        color: AppTheme.primaryBlue,
        backgroundColor: context.surfaceColor,
        child: followUpsAsyncValue.when(
          data: (followUps) {
            if (followUps.isEmpty) {
              return Center(
                child: Text('No follow-ups found.', style: AppTheme.bodyLarge.copyWith(color: context.textMutedColor)),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: followUps.length,
              itemBuilder: (context, index) {
                final followUp = followUps[index];
                final dateStr = DateFormat('MMM d, yyyy').format(followUp.dueDate);
                final isOverdue = followUp.dueDate.isBefore(DateTime.now()) && followUp.status == 'pending';
                
                final Color statusColor = followUp.status == 'completed' 
                    ? AppTheme.successGreen 
                    : (isOverdue ? AppTheme.dangerRed : AppTheme.warningOrange);

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isOverdue ? statusColor : context.borderSubtleColor),
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
                              followUp.visit?.site?.name ?? 'Unknown Site',
                              style: AppTheme.headingSmall.copyWith(fontSize: 16, color: context.textPrimaryColor),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              followUp.status.toUpperCase(),
                              style: AppTheme.bodySmall.copyWith(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(Icons.event_rounded, size: 16, color: statusColor),
                          const SizedBox(width: 6),
                          Text('Due: $dateStr', style: AppTheme.bodySmall.copyWith(
                            color: isOverdue ? AppTheme.dangerRed : context.textPrimaryColor,
                            fontWeight: isOverdue ? FontWeight.bold : FontWeight.normal,
                          )),
                        ],
                      ),
                      if (followUp.notes != null && followUp.notes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.backgroundColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: context.borderSubtleColor),
                          ),
                          child: Text(followUp.notes!, style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor)),
                        ),
                      ],
                      if (followUp.status == 'pending') ...[
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () {
                              ref.read(followUpStatusProvider.notifier).updateStatus(followUp.id, 'completed');
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.successGreen,
                              side: const BorderSide(color: AppTheme.successGreen),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('MARK COMPLETED'),
                          ),
                        ),
                      ]
                    ],
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

  Widget _buildFilterChip(BuildContext context, String value, String label) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryBlue : context.surfaceColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppTheme.primaryBlue : context.borderSubtleColor),
        ),
        child: Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: isSelected ? Colors.white : context.textSecondaryColor,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
