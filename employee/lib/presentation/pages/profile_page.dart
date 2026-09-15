import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../app_theme.dart';
import '../login_page.dart';
import '../providers/profile_provider.dart';
import '../providers/dashboard_provider.dart';
import '../../data/models/models.dart';
import '../providers/theme_provider.dart';
import '../../data/api_repository.dart';
class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsyncValue = ref.watch(profileProvider);
    final dashboardAsyncValue = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      body: profileAsyncValue.when(
        data: (profile) => _buildProfileContent(context, ref, profile, dashboardAsyncValue),
        loading: () => Center(
          child: CircularProgressIndicator(color: context.accentColor),
        ),
        error: (error, _) => Center(
          child: Text(
            'Error: $error',
            style: const TextStyle(color: AppTheme.dangerRed),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileContent(
    BuildContext context,
    WidgetRef ref,
    Employee profile,
    AsyncValue<Map<String, dynamic>> dashboardAsyncValue,
  ) {
    final isActive = profile.status.toLowerCase() == 'active';
    final stats = dashboardAsyncValue.asData?.value['stats'];

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 56, 20, 28),
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
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: Icon(context.isDarkMode ? Icons.light_mode : Icons.dark_mode),
                    color: Colors.white,
                    onPressed: () {
                      ref.read(themeProvider.notifier).toggleTheme(context);
                    },
                  ),
                ),
                Stack(
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.15),
                        border: Border.all(color: Colors.white, width: 2),
                        image: profile.profilePicture != null
                            ? DecorationImage(
                                image: NetworkImage('$baseUrl${profile.profilePicture}'),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: profile.profilePicture == null
                          ? const Center(
                              child: Icon(Icons.person, color: Colors.white, size: 44),
                            )
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: () async {
                          final picker = ImagePicker();
                          final image = await picker.pickImage(source: ImageSource.gallery);
                          if (image != null) {
                            ref.read(profileProvider.notifier).uploadProfilePicture(image.path);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: context.headerGradientColors.first, width: 2),
                          ),
                          child: Icon(Icons.camera_alt, color: context.headerGradientColors.first, size: 15),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  profile.name,
                  textAlign: TextAlign.center,
                  style: AppTheme.headingMedium.copyWith(color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  profile.role.replaceAll('-', ' ').toUpperCase(),
                  textAlign: TextAlign.center,
                  style: AppTheme.bodySmall.copyWith(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  profile.id,
                  textAlign: TextAlign.center,
                  style: AppTheme.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.65)),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ─── Approved / Denied / Pending stat row ──────────
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        context,
                        value: '${stats?['approvedVisits'] ?? 0}',
                        label: 'Approved',
                        color: AppTheme.successGreen,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        context,
                        value: '${stats?['rejectedVisits'] ?? 0}',
                        label: 'Denied',
                        color: AppTheme.dangerRed,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        context,
                        value: '${stats?['pendingVisits'] ?? 0}',
                        label: 'Pending',
                        color: AppTheme.warningOrange,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // ─── Status badge ───────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.borderSubtleColor),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: context.backgroundColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.check_circle_outline, color: context.textSecondaryColor, size: 20),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text('Status', style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor, fontWeight: FontWeight.w500)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: (isActive ? AppTheme.successGreen : context.textMutedColor).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          isActive ? 'Active' : 'Inactive',
                          style: AppTheme.bodySmall.copyWith(
                            color: isActive ? AppTheme.successGreen : context.textMutedColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                if (profile.phone != null) ...[
                  _buildInfoTile(context, Icons.phone_rounded, 'Phone Number', profile.phone!),
                  const SizedBox(height: 12),
                ],
                _buildInfoTile(
                  context,
                  Icons.calendar_today_rounded,
                  'Joined',
                  DateFormat('MMM d, yyyy').format(profile.createdAt),
                ),
                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.logout_rounded, color: AppTheme.dangerRed),
                    label: Text(
                      'LOGOUT',
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
                    onPressed: () {
                      Navigator.of(context, rootNavigator: true).pushReplacement(
                        MaterialPageRoute(builder: (_) => const LoginPage()),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, {required String value, required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.borderSubtleColor),
        boxShadow: AppTheme.subtleShadow,
      ),
      child: Column(
        children: [
          Text(value, style: AppTheme.headingMedium.copyWith(color: color)),
          const SizedBox(height: 4),
          Text(label, style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildInfoTile(BuildContext context, IconData icon, String title, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.borderSubtleColor),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: context.backgroundColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: context.textSecondaryColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: AppTheme.bodyLarge.copyWith(
                    fontWeight: FontWeight.w500,
                    color: context.textPrimaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}