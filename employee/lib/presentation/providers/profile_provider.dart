import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/models.dart';
import '../../data/api_repository.dart';
import 'api_provider.dart';

class ProfileNotifier extends StateNotifier<AsyncValue<Employee>> {
  final ApiRepository repository;

  ProfileNotifier(this.repository) : super(const AsyncValue.loading()) {
    refresh();
  }

  Future<void> refresh() async {
    try {
      state = const AsyncValue.loading();
      final profile = await repository.getProfile();
      state = AsyncValue.data(profile);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> uploadProfilePicture(String filePath) async {
    try {
      final updatedProfile = await repository.uploadProfilePicture(filePath);
      state = AsyncValue.data(updatedProfile);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final profileProvider = StateNotifierProvider.autoDispose<ProfileNotifier, AsyncValue<Employee>>((ref) {
  final repository = ref.watch(apiRepositoryProvider);
  return ProfileNotifier(repository);
});
