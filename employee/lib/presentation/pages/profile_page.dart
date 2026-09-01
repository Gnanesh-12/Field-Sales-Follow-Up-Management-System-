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
      body: profileAsyncValue.when(
        data: (profile) => _buildProfileContent(context, ref, profile),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryBlue),
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
                  color: AppTheme.primaryBlueLight,
                  border: Border.all(color: AppTheme.primaryBlue, width: 2),
                  image: profile.profilePicture != null
                      ? DecorationImage(
                          image: NetworkImage('$baseUrl${profile.profilePicture}'),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: profile.profilePicture == null
                    ? const Center(
                        child: Icon(Icons.person, color: AppTheme.primaryBlue, size: 50),
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
                      color: AppTheme.primaryBlue,
                      shape: BoxShape.circle,
                      border: Border.all(color: context.surfaceColor, width: 2),
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
        const SizedBox(height: 4),
        Text(
          profile.role.replaceAll('-', ' ').toUpperCase(),
          textAlign: TextAlign.center,
          style: AppTheme.bodySmall.copyWith(
            color: context.textSecondaryColor,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 40),
        _buildInfoTile(context, Icons.badge_rounded, 'Employee ID', profile.id),
        const SizedBox(height: 12),
        if (profile.phone != null) ...[
          _buildInfoTile(context, Icons.phone_rounded, 'Phone Number', profile.phone!),
          const SizedBox(height: 12),
        ],
        _buildInfoTile(
          context,
          Icons.check_circle_outline,
          'Status',
          profile.status.toUpperCase(),
        ),
        const SizedBox(height: 12),
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
            icon: const Icon(Icons.logout_rounded, color: AppTheme.dangerRed),
            label: Text(
              'LOGOUT',
              style: AppTheme.buttonText.copyWith(color: AppTheme.dangerRed),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: context.surfaceColor,
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
