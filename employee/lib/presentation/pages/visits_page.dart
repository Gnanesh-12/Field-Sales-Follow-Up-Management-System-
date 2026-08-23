import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../providers/visits_provider.dart';
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
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDark,
        title: Text('My Visits', style: AppTheme.headingSmall),
        centerTitle: true,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(visitsProvider(1)),
        color: AppTheme.accentCoral,
        backgroundColor: AppTheme.surfaceDark,
        child: visitsAsyncValue.when(
          data: (data) {
            final List visits = data['visits'];
            if (visits.isEmpty) {
              return Center(
                child: Text('No field visits logged yet.', style: AppTheme.bodyLarge),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: visits.length,
              itemBuilder: (context, index) {
                final visit = visits[index];
                final timeStr = DateFormat('MMM d, yyyy - h:mm a').format(visit.timestamp);
                
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
                      color: AppTheme.surfaceDark.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderSubtle),
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
                                style: AppTheme.headingSmall.copyWith(fontSize: 16),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const Icon(Icons.chevron_right_rounded, color: AppTheme.textMuted),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.access_time_rounded, color: AppTheme.textMuted, size: 14),
                            const SizedBox(width: 6),
                            Text(timeStr, style: AppTheme.bodySmall),
                          ],
                        ),
                        if (visit.materials.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.inventory_2_rounded, color: AppTheme.textMuted, size: 14),
                              const SizedBox(width: 6),
                              Text('${visit.materials.length} material(s)', style: AppTheme.bodySmall),
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
          loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.accentTeal)),
          error: (error, _) => Center(child: Text('Error: $error', style: const TextStyle(color: Colors.red))),
        ),
      ),
    );
  }
}
