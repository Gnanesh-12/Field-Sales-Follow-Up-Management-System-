import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../login_page.dart';
import '../providers/profile_provider.dart';
import '../../data/models/models.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsyncValue = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDark,
        title: Text('Profile', style: AppTheme.headingSmall),
        centerTitle: true,
        elevation: 0,
      ),
      body: profileAsyncValue.when(
        data: (profile) => _buildProfileContent(context, profile),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.accentTeal),
        ),
        error: (error, _) => Center(
          child: Text(
            'Error: $error',
            style: const TextStyle(color: Colors.red),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileContent(BuildContext context, Employee profile) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          profile.role.replaceAll('-', ' ').toUpperCase(),
          textAlign: TextAlign.center,
          style: AppTheme.bodySmall.copyWith(
            color: AppTheme.accentGold,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 40),
        _buildInfoTile(Icons.badge_rounded, 'Employee ID', profile.id),
        const SizedBox(height: 16),
        if (profile.phone != null) ...[
          _buildInfoTile(Icons.phone_rounded, 'Phone Number', profile.phone!),
          const SizedBox(height: 16),
        ],
        _buildInfoTile(
          Icons.check_circle_outline,
          'Status',
          profile.status.toUpperCase(),
        ),
        const SizedBox(height: 16),
        _buildInfoTile(
          Icons.calendar_today_rounded,
          'Joined',
          DateFormat('MMM d, yyyy').format(profile.createdAt),
        ),
        const SizedBox(height: 40),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            icon: const Icon(Icons.logout_rounded, color: Colors.white),
            label: const Text(
              'LOGOUT',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentPink,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () {
              Navigator.of(context, rootNavigator: true).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginPage()),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.backgroundDark,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.textMuted, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTheme.bodySmall.copyWith(color: AppTheme.textMuted),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: AppTheme.bodyLarge.copyWith(
                    fontWeight: FontWeight.w500,
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
