import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/models.dart';
import 'api_provider.dart';

final visitsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, int>((ref, page) async {
  final repository = ref.watch(apiRepositoryProvider);
  return repository.getVisits(page: page);
});
