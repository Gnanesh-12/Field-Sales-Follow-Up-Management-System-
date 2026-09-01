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
                            if (hasFollowUp)
                              Icon(
                                Icons.flag,
                                color: isPendingFollowUp ? AppTheme.warningOrange : AppTheme.successGreen,
                                size: 20,
                              )
                            else
                              Icon(Icons.chevron_right_rounded, color: context.textMutedColor),
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
