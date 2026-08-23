import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../providers/follow_ups_provider.dart';

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
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDark,
        title: Text('Follow-ups', style: AppTheme.headingSmall),
        centerTitle: true,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('pending', 'Pending'),
                const SizedBox(width: 12),
                _buildFilterChip('completed', 'Completed'),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(followUpsProvider(_filter)),
        color: AppTheme.accentCoral,
        backgroundColor: AppTheme.surfaceDark,
        child: followUpsAsyncValue.when(
          data: (followUps) {
            if (followUps.isEmpty) {
              return Center(
                child: Text('No follow-ups found.', style: AppTheme.bodyLarge),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: followUps.length,
              itemBuilder: (context, index) {
                final followUp = followUps[index];
                final dateStr = DateFormat('MMM d, yyyy').format(followUp.dueDate);
                final isOverdue = followUp.dueDate.isBefore(DateTime.now()) && followUp.status == 'pending';

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceDark.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isOverdue ? AppTheme.accentPink : AppTheme.borderSubtle),
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
                              style: AppTheme.headingSmall.late().copyWith(fontSize: 16),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: followUp.status == 'completed' 
                                  ? AppTheme.accentGreen.withValues(alpha: 0.2)
                                  : (isOverdue ? AppTheme.accentPink.withValues(alpha: 0.2) : AppTheme.accentGold.withValues(alpha: 0.2)),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              followUp.status.toUpperCase(),
                              style: AppTheme.bodySmall.copyWith(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: followUp.status == 'completed' 
                                    ? AppTheme.accentGreen 
                                    : (isOverdue ? AppTheme.accentPink : AppTheme.accentGold),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(Icons.event_rounded, size: 16, color: isOverdue ? AppTheme.accentPink : AppTheme.textMuted),
                          const SizedBox(width: 6),
                          Text('Due: $dateStr', style: AppTheme.bodySmall.copyWith(
                            color: isOverdue ? AppTheme.accentPink : AppTheme.textPrimary,
                          )),
                        ],
                      ),
                      if (followUp.notes != null && followUp.notes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(followUp.notes!, style: AppTheme.bodySmall.copyWith(fontStyle: FontStyle.italic)),
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
                              foregroundColor: AppTheme.accentGreen,
                              side: const BorderSide(color: AppTheme.accentGreen),
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
          loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.accentTeal)),
          error: (error, _) => Center(child: Text('Error: $error', style: const TextStyle(color: Colors.red))),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentCoral : AppTheme.surfaceDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppTheme.accentCoral : AppTheme.borderSubtle),
        ),
        child: Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: isSelected ? Colors.white : AppTheme.textMuted,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

extension on TextStyle {
  TextStyle late() {
    return this;
  }
}
