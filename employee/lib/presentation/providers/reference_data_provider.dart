import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/models.dart';
import 'api_provider.dart';

final customerSitesProvider = FutureProvider.autoDispose<List<CustomerSite>>((ref) async {
  final repository = ref.watch(apiRepositoryProvider);
  return repository.getCustomerSites();
});

final materialsProvider = FutureProvider.autoDispose<List<MaterialItem>>((ref) async {
  final repository = ref.watch(apiRepositoryProvider);
  return repository.getMaterials();
});
