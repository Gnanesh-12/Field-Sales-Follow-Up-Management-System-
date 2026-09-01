import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../app_theme.dart';
import '../providers/api_provider.dart';
import '../../data/models/models.dart';

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../data/api_repository.dart';
import '../providers/dashboard_provider.dart';
import '../providers/visits_provider.dart';

final addressProvider = FutureProvider.family<String, (double, double)>((ref, coords) async {
  try {
    final url = Uri.parse('https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.$1}&lon=${coords.$2}');
    final response = await http.get(url, headers: {'User-Agent': 'FieldSalesApp/1.0'});
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['display_name'] ?? 'Address not found';
    }
    return 'Address not found (HTTP ${response.statusCode})';
  } catch (e) {
    return 'Address not found ($e)';
  }
});

final visitDetailProvider = FutureProvider.autoDispose.family<FieldVisit, String>((ref, id) async {
  final repository = ref.watch(apiRepositoryProvider);
  return repository.getVisitDetail(id);
});

class VisitDetailPage extends ConsumerWidget {
  final String visitId;

  const VisitDetailPage({super.key, required this.visitId});

  Future<void> _deleteVisit(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ctx.surfaceColor,
        title: Text('Delete Visit', style: AppTheme.headingSmall.copyWith(color: ctx.textPrimaryColor)),
        content: Text('Are you sure you want to delete this visit?', style: AppTheme.bodyMedium.copyWith(color: ctx.textSecondaryColor)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: TextStyle(color: ctx.textMutedColor))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: AppTheme.dangerRed))),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await ref.read(apiRepositoryProvider).deleteVisit(visitId);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Visit deleted')));
          ref.invalidate(dashboardProvider);
          ref.invalidate(visitsProvider);
          Navigator.pop(context);
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitAsync = ref.watch(visitDetailProvider(visitId));

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('Visit Report', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: false,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppTheme.dangerRed),
            onPressed: () => _deleteVisit(context, ref),
          ),
        ],
      ),
      body: visitAsync.when(
        data: (visit) => _buildDetailContent(context, visit),
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
        error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: AppTheme.dangerRed))),
      ),
    );
  }

  Widget _buildDetailContent(BuildContext context, FieldVisit visit) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // ─── Header ───────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                visit.site?.name ?? 'Unknown Site',
                style: AppTheme.headingMedium.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.white70, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      visit.site?.address ?? 'No address',
                      style: AppTheme.bodySmall.copyWith(color: Colors.white),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(Icons.access_time, color: Colors.white70, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat('MMM d, yyyy - h:mm a').format(visit.timestamp),
                    style: AppTheme.bodySmall.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),

        // ─── Location Data ─────────────────────────────────────
        if (visit.location != null) ...[
          _buildSectionTitle('GPS Location'),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.surfaceColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.borderSubtleColor),
            ),
            child: Row(
              children: [
                const Icon(Icons.map_outlined, color: AppTheme.primaryBlue, size: 28),
                const SizedBox(width: 16),
                Expanded(
                  child: Consumer(
                    builder: (context, ref, child) {
                      final addressAsync = ref.watch(addressProvider((visit.location!.lat, visit.location!.lng)));
                      return addressAsync.when(
                        data: (address) => Text(address, style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor)),
                        loading: () => Text('Loading address...', style: TextStyle(color: context.textMutedColor, fontSize: 14)),
                        error: (e, st) => const Text('Address unavailable', style: TextStyle(color: AppTheme.dangerRed, fontSize: 14)),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],

        // ─── Image Attachment ──────────────────────────────────
        if (visit.attachments.isNotEmpty) ...[
          _buildSectionTitle('Site Evidence'),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              visit.attachments.first.fileUrl.startsWith('http') 
                  ? visit.attachments.first.fileUrl 
                  : "$baseUrl/${visit.attachments.first.fileUrl.startsWith('/') ? visit.attachments.first.fileUrl.substring(1) : visit.attachments.first.fileUrl}",
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                height: 200,
                color: context.surfaceColor,
                child: Center(child: Icon(Icons.broken_image_rounded, color: context.textMutedColor, size: 48)),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],

        // ─── Materials ─────────────────────────────────────────
        if (visit.materials.isNotEmpty) ...[
          _buildSectionTitle('Materials Supplied'),
          ...visit.materials.map((m) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.surfaceColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.borderSubtleColor),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(m.material?.name ?? 'Unknown', style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor)),
                Text('${m.quantity} ${m.material?.unit ?? ''}', 
                  style: AppTheme.bodyLarge.copyWith(fontWeight: FontWeight.bold, color: context.textPrimaryColor)),
              ],
            ),
          )),
          const SizedBox(height: 32),
        ],

        // ─── Remarks ───────────────────────────────────────────
        if (visit.remarks != null && visit.remarks!.isNotEmpty) ...[
          _buildSectionTitle('Notes / Remarks'),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.surfaceColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.borderSubtleColor),
            ),
            child: Text(visit.remarks!, style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor)),
          ),
          const SizedBox(height: 32),
        ],

        // ─── Follow-Ups ────────────────────────────────────────
        if (visit.followUps.isNotEmpty) ...[
          _buildSectionTitle('Follow-up Information'),
          ...visit.followUps.map((f) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: f.status == 'pending' ? AppTheme.warningOrange.withValues(alpha: 0.05) : AppTheme.successGreen.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: f.status == 'pending' ? AppTheme.warningOrange : AppTheme.successGreen),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.flag, size: 20, color: f.status == 'pending' ? AppTheme.warningOrange : AppTheme.successGreen),
                        const SizedBox(width: 8),
                        Text("Due: ${DateFormat('MMM d, yyyy').format(f.dueDate)}", 
                          style: AppTheme.bodyLarge.copyWith(fontWeight: FontWeight.bold, color: context.textPrimaryColor)),
                      ],
                    ),
                    Text(
                      f.status.toUpperCase(), 
                      style: AppTheme.bodySmall.copyWith(
                        fontWeight: FontWeight.bold,
                        color: f.status == 'pending' ? AppTheme.warningOrange : AppTheme.successGreen,
                      ),
                    ),
                  ],
                ),
                if (f.notes != null && f.notes!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(f.notes!, style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor)),
                ]
              ],
            ),
          )),
        ],
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Builder(
      builder: (context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(
          title,
          style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor),
        ),
      ),
    );
  }
}
