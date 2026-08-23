import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../../data/api_repository.dart';
import 'auth_provider.dart';

final httpClientProvider = Provider<http.Client>((ref) {
  return http.Client();
});

final apiRepositoryProvider = Provider<ApiRepository>((ref) {
  final client = ref.watch(httpClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return ApiRepository(client: client, storage: storage);
});
