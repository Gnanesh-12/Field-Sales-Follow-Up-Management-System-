import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'app_theme.dart';
import 'providers/dashboard_provider.dart';
import 'providers/profile_provider.dart';
import 'pages/new_visit_page.dart';
import '../../data/models/models.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsyncValue = ref.watch(dashboardProvider);
    final profileAsyncValue = ref.watch(profileProvider);
    final name = profileAsyncValue.asData?.value.name.split(' ').first ?? '';

    return Scaffold(
      backgroundColor: context.backgroundColor,
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(dashboardProvider),
        color: context.accentColor,
        backgroundColor: context.surfaceColor,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 56, 20, 32),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: context.headerGradientColors,
                  ),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(28),
                    bottomRight: Radius.circular(28),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      DateFormat('EEEE, d MMM').format(DateTime.now()),
                      style: AppTheme.bodyMedium.copyWith(color: Colors.white.withValues(alpha: 0.75)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      name.isEmpty ? _greeting() : '${_greeting()}, $name',
                      style: AppTheme.headingLarge.copyWith(color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: dashboardAsyncValue.when(
                data: (data) => _buildContent(context, data),
                loading: () => const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (error, stack) => Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
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
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: context.accentColor,
        foregroundColor: Colors.white,
        onPressed: () {
          Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => const NewVisitPage(),
          ));
        },
        child: const Icon(Icons.add_rounded, size: 32),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Map<String, dynamic> data) {
    final stats = data['stats'];
    final List recentVisitsRaw = data['recentVisits'];
    final recentVisits = recentVisitsRaw.map((e) => FieldVisit.fromJson(e)).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats Summary
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  context,
                  title: 'Visits Today',
                  value: '${stats['todayVisits'] ?? 0}',
                  icon: Icons.map_rounded,
                  color: context.accentColor,
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
          const SizedBox(height: 28),

          // Recent Activity
          Text('Recent Activity', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
          const SizedBox(height: 16),
          if (recentVisits.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.surfaceColor,
                borderRadius: BorderRadius.circular(16),
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
      ),
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
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
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.borderSubtleColor),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: context.accentColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.storefront_rounded, color: context.accentColor),
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