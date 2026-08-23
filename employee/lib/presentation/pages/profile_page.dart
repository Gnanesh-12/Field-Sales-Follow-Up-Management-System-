import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../app_theme.dart';
import '../login_page.dart';
import '../providers/profile_provider.dart';
import '../../data/models/models.dart';
import '../providers/theme_provider.dart';
import '../../data/api_repository.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsyncValue = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('Profile', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: true,
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
      body: profileAsyncValue.when(
        data: (profile) => _buildProfileContent(context, ref, profile),
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

  Widget _buildProfileContent(BuildContext context, WidgetRef ref, Employee profile) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Center(
          child: Stack(
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppTheme.accentGradient,
                  boxShadow: AppTheme.glowShadow(AppTheme.accentCoral),
                  image: profile.profilePicture != null
                      ? DecorationImage(
                          image: NetworkImage('$baseUrl${profile.profilePicture}'),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: profile.profilePicture == null
                    ? const Center(
                        child: Icon(Icons.person, color: Colors.white, size: 50),
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
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.accentTeal,
                      shape: BoxShape.circle,
                      border: Border.all(color: context.surfaceColor, width: 2),
                      boxShadow: AppTheme.glowShadow(AppTheme.accentTeal),
                    ),
                    child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          profile.name,
          textAlign: TextAlign.center,
          style: AppTheme.headingMedium.copyWith(color: context.textPrimaryColor),
        ),
        const SizedBox(height: 8),
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
        _buildInfoTile(context, Icons.badge_rounded, 'Employee ID', profile.id),
        const SizedBox(height: 16),
        if (profile.phone != null) ...[
          _buildInfoTile(context, Icons.phone_rounded, 'Phone Number', profile.phone!),
          const SizedBox(height: 16),
        ],
        _buildInfoTile(
          context,
          Icons.check_circle_outline,
          'Status',
          profile.status.toUpperCase(),
        ),
        const SizedBox(height: 16),
        _buildInfoTile(
          context,
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

  Widget _buildInfoTile(BuildContext context, IconData icon, String title, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.surfaceColor.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
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
            child: Icon(icon, color: context.textMutedColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTheme.bodySmall.copyWith(color: context.textMutedColor),
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
