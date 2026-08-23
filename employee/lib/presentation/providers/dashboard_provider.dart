import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_provider.dart';

final dashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(apiRepositoryProvider);
  return repository.getDashboardSummary();
});
