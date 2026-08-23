import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'app_theme.dart';
import 'login_page.dart';
import 'providers/dashboard_provider.dart';
import 'pages/new_visit_page.dart';
import '../../data/models/models.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dashboardAsyncValue = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.refresh(dashboardProvider),
          color: AppTheme.accentCoral,
          backgroundColor: AppTheme.surfaceDark,
          child: CustomScrollView(
            slivers: [
              // ─── Custom App Bar ─────────────────────────────────────
              SliverToBoxAdapter(
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, -0.3),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: _animController,
                    curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
                  )),
                  child: FadeTransition(
                    opacity: CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
                    ),
                    child: _buildAppBar(),
                  ),
                ),
              ),

              dashboardAsyncValue.when(
                data: (data) => _buildDashboardContent(data),
                loading: () => const SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.accentTeal),
                  ),
                ),
                error: (error, stack) => SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, color: AppTheme.accentPink, size: 48),
                        const SizedBox(height: 16),
                        Text('Failed to load dashboard', style: AppTheme.bodyLarge),
                        Text(error.toString(), style: AppTheme.bodySmall),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () => ref.refresh(dashboardProvider),
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
      ),
    );
  }

  Widget _buildDashboardContent(Map<String, dynamic> data) {
    final stats = data['stats'];
    final List recentVisits = data['recentVisits'];
    
    return SliverList(
      delegate: SliverChildListDelegate([
        // ─── Welcome Card ───────────────────────────────────────
        SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.3),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: _animController,
            curve: const Interval(0.15, 0.5, curve: Curves.easeOut),
          )),
          child: FadeTransition(
            opacity: CurvedAnimation(
              parent: _animController,
              curve: const Interval(0.15, 0.5, curve: Curves.easeOut),
            ),
            child: _buildWelcomeCard(stats),
          ),
        ),

        // ─── Stat Cards ────────────────────────────────────────
        SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.3),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: _animController,
            curve: const Interval(0.3, 0.65, curve: Curves.easeOut),
          )),
          child: FadeTransition(
            opacity: CurvedAnimation(
              parent: _animController,
              curve: const Interval(0.3, 0.65, curve: Curves.easeOut),
            ),
            child: _buildStatCards(stats),
          ),
        ),

        // ─── Quick Actions ─────────────────────────────────────
        SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.3),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: _animController,
            curve: const Interval(0.6, 0.95, curve: Curves.easeOut),
          )),
          child: FadeTransition(
            opacity: CurvedAnimation(
              parent: _animController,
              curve: const Interval(0.6, 0.95, curve: Curves.easeOut),
            ),
            child: _buildQuickActions(),
          ),
        ),

        // ─── Recent Activity ───────────────────────────────────
        SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.3),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: _animController,
            curve: const Interval(0.45, 0.8, curve: Curves.easeOut),
          )),
          child: FadeTransition(
            opacity: CurvedAnimation(
              parent: _animController,
              curve: const Interval(0.45, 0.8, curve: Curves.easeOut),
            ),
            child: _buildRecentActivity(recentVisits),
          ),
        ),

        const SizedBox(height: 100),
      ]),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTheme.accentGradient,
              boxShadow: AppTheme.glowShadow(AppTheme.accentCoral),
            ),
            child: const Center(
              child: Icon(Icons.person, color: Colors.white),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Good Morning 👋',
                    style: AppTheme.bodySmall
                        .copyWith(fontSize: 13, color: AppTheme.textMuted)),
                const SizedBox(height: 2),
                Text('Field Sales Rep',
                    style: AppTheme.headingSmall.copyWith(fontSize: 17)),
              ],
            ),
          ),
          // Logout
          _buildIconButton(Icons.logout_rounded, onTap: () {
            Navigator.of(context, rootNavigator: true).pushReplacement(
              MaterialPageRoute(builder: (_) => const LoginPage()),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildIconButton(IconData icon, {int? badge, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: AppTheme.surfaceDark.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Stack(
          children: [
            Center(child: Icon(icon, color: AppTheme.textSecondary, size: 22)),
            if (badge != null && badge > 0)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    color: AppTheme.accentCoral,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text('$badge',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeCard(Map<String, dynamic> stats) {
    final todayVisits = stats['todayVisits'] ?? 0;
    final pendingFollowUps = stats['pendingFollowUps'] ?? 0;

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E3A5F), Color(0xFF0F3460)],
        ),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F3460).withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Today's Overview",
                    style: AppTheme.headingSmall.copyWith(fontSize: 16)),
                const SizedBox(height: 6),
                Text(
                  'You have $todayVisits visits logged today and $pendingFollowUps follow-ups pending.',
                  style: AppTheme.bodyMedium.copyWith(height: 1.4),
                ),
                const SizedBox(height: 14),
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => const NewVisitPage(),
                    ));
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: AppTheme.accentGradient,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text('Start Day',
                        style: AppTheme.bodySmall.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.accentTeal.withValues(alpha: 0.15),
            ),
            child: const Icon(Icons.trending_up_rounded,
                color: AppTheme.accentTeal, size: 36),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCards(Map<String, dynamic> stats) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          Expanded(
              child: _StatCard(
                  title: 'Visits\nToday',
                  value: '${stats['todayVisits'] ?? 0}',
                  gradient: AppTheme.tealGradient,
                  icon: Icons.location_on_rounded)),
          const SizedBox(width: 12),
          Expanded(
              child: _StatCard(
                  title: 'Pending\nFollow-ups',
                  value: '${stats['pendingFollowUps'] ?? 0}',
                  gradient: AppTheme.goldGradient,
                  icon: Icons.pending_actions_rounded)),
          const SizedBox(width: 12),
          Expanded(
              child: _StatCard(
                  title: 'Completed\nThis Week',
                  value: '${stats['completedThisWeek'] ?? 0}',
                  gradient: AppTheme.greenGradient,
                  icon: Icons.check_circle_outline_rounded)),
        ],
      ),
    );
  }

  Widget _buildRecentActivity(List recentVisitsRaw) {
    final visits = recentVisitsRaw.map((e) => FieldVisit.fromJson(e)).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recent Activity', style: AppTheme.headingSmall),
          const SizedBox(height: 14),
          if (visits.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text("No recent activity", style: AppTheme.bodyMedium),
              ),
            ),
          ...visits.map((v) => _buildActivityTile(v)),
        ],
      ),
    );
  }

  Widget _buildActivityTile(FieldVisit visit) {
    final timeStr = DateFormat('MMM d, h:mm a').format(visit.timestamp);
    final followUpPending = visit.followUps.any((f) => f.status == 'pending');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.accentTeal.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.storefront_rounded, color: AppTheme.accentTeal, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Visited ${visit.site?.name ?? 'Unknown Site'}',
                    style: AppTheme.bodyLarge
                        .copyWith(fontWeight: FontWeight.w600, fontSize: 14),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Text(followUpPending ? 'Follow-up pending' : 'Completed', 
                  style: AppTheme.bodySmall.copyWith(
                    color: followUpPending ? AppTheme.accentGold : AppTheme.accentGreen,
                  )),
              ],
            ),
          ),
          Text(timeStr,
              style: AppTheme.bodySmall.copyWith(color: AppTheme.textMuted, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions', style: AppTheme.headingSmall),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => const NewVisitPage(),
                    ));
                  },
                  child: _buildQuickActionCard(
                      Icons.add_location_alt_rounded,
                      'New Visit',
                      AppTheme.accentTeal),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 10),
          Text(label,
              style: AppTheme.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                  fontSize: 12)),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final LinearGradient gradient;
  final IconData icon;

  const _StatCard({
    required this.title,
    required this.value,
    required this.gradient,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: gradient.colors.first.withValues(alpha: 0.35),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 12),
          Text(value,
              style: AppTheme.headingMedium
                  .copyWith(fontSize: 26, letterSpacing: -0.5)),
          const SizedBox(height: 4),
          Text(title,
              textAlign: TextAlign.center,
              style: AppTheme.bodySmall.copyWith(
                  fontSize: 11, height: 1.3, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
