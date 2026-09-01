import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'app_theme.dart';
import 'providers/dashboard_provider.dart';
import 'pages/new_visit_page.dart';
import '../../data/models/models.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsyncValue = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text('Today\'s Overview', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: false,
        backgroundColor: context.surfaceColor,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(dashboardProvider),
        color: AppTheme.primaryBlue,
        backgroundColor: context.surfaceColor,
        child: dashboardAsyncValue.when(
          data: (data) => _buildContent(context, data, ref),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: AppTheme.dangerRed, size: 48),
                const SizedBox(height: 16),
                Text(error.toString(), style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(dashboardProvider),
                  style: AppTheme.primaryButton,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Map<String, dynamic> data, WidgetRef ref) {
    final stats = data['stats'];
    final List recentVisitsRaw = data['recentVisits'];
    final recentVisits = recentVisitsRaw.map((e) => FieldVisit.fromJson(e)).toList();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Primary Action
        ElevatedButton.icon(
          onPressed: () {
            Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => const NewVisitPage(),
            ));
          },
          style: AppTheme.primaryButton.copyWith(
            padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 20)),
          ),
          icon: const Icon(Icons.add_location_alt_rounded, size: 28),
          label: const Text('START NEW VISIT', style: TextStyle(fontSize: 18, letterSpacing: 1.2)),
        ),
        const SizedBox(height: 32),

        // Stats Summary
        Text('Summary', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                title: 'Visits Today',
                value: '${stats['todayVisits'] ?? 0}',
                icon: Icons.map_rounded,
                color: AppTheme.primaryBlue,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatCard(
                context,
                title: 'Follow-ups',
                value: '${stats['pendingFollowUps'] ?? 0}',
                icon: Icons.pending_actions_rounded,
                color: AppTheme.warningOrange,
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),

        // Recent Activity
        Text('Recent Activity', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        const SizedBox(height: 16),
        if (recentVisits.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: context.surfaceColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.borderSubtleColor),
            ),
            child: Center(
              child: Text(
                'No visits recorded today.',
                style: AppTheme.bodyMedium.copyWith(color: context.textMutedColor),
              ),
            ),
          )
        else
          ...recentVisits.map((v) => _buildActivityTile(context, v)),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, {required String title, required String value, required IconData icon, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.borderSubtleColor),
        boxShadow: AppTheme.subtleShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 16),
          Text(
            value,
            style: AppTheme.headingLarge.copyWith(color: context.textPrimaryColor, fontSize: 32),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityTile(BuildContext context, FieldVisit visit) {
    final timeStr = DateFormat('h:mm a').format(visit.timestamp);
    final followUpPending = visit.followUps.any((f) => f.status == 'pending');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.borderSubtleColor),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.storefront_rounded, color: AppTheme.primaryBlue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  visit.site?.name ?? 'Unknown Site',
                  style: AppTheme.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: context.textPrimaryColor),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 14, color: context.textMutedColor),
                    const SizedBox(width: 4),
                    Text(timeStr, style: AppTheme.bodySmall.copyWith(color: context.textMutedColor)),
                    if (followUpPending) ...[
                      const SizedBox(width: 12),
                      Icon(Icons.flag, size: 14, color: AppTheme.warningOrange),
                      const SizedBox(width: 4),
                      Text('Follow-up', style: AppTheme.bodySmall.copyWith(color: AppTheme.warningOrange)),
                    ]
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
