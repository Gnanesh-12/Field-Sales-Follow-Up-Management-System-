import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/models.dart';
import 'api_provider.dart';

final profileProvider = FutureProvider.autoDispose<Employee>((ref) async {
  final repository = ref.watch(apiRepositoryProvider);
  return repository.getProfile();
});
