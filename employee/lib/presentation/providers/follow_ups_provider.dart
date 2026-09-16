import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/models.dart';
import 'api_provider.dart';
import 'dashboard_provider.dart';

final followUpsProvider = FutureProvider.autoDispose.family<List<FollowUp>, String?>((ref, status) async {
  final repository = ref.watch(apiRepositoryProvider);
  return repository.getFollowUps(status: status);
});

class FollowUpStatusNotifier extends StateNotifier<AsyncValue<FollowUp?>> {
  FollowUpStatusNotifier(this.ref) : super(const AsyncValue.data(null));

  final Ref ref;

  Future<void> updateStatus(String id, String status) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(apiRepositoryProvider);
      final updated = await repository.updateFollowUpStatus(id, status);
      state = AsyncValue.data(updated);
      
      // Invalidate relevant providers to refresh the UI
      ref.invalidate(followUpsProvider);
      ref.invalidate(dashboardProvider);
    } catch (e, st) {
      // Handle 403 Forbidden (approval not granted) gracefully
      // The error message from ApiException is already user-friendly from the backend.
      state = AsyncValue.error(e, st);
    }
  }
}

final followUpStatusProvider = StateNotifierProvider<FollowUpStatusNotifier, AsyncValue<FollowUp?>>((ref) {
  return FollowUpStatusNotifier(ref);
});
