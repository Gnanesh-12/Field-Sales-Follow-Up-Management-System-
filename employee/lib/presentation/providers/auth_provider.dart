import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../data/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

class AuthState {
  final bool isLoading;
  final AuthException? error;
  final bool isAuthenticated;

  AuthState({
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    bool? isLoading,
    AuthException? error,
    bool? isAuthenticated,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final FlutterSecureStorage _storage;

  AuthNotifier(this._repository, this._storage) : super(AuthState());

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  Future<void> login(String employeeId, String pin) async {
    state = AuthState(isLoading: true, isAuthenticated: false, error: null);

    try {
      final result = await _repository.login(employeeId, pin);
      
      final token = result['token'] as String;
      final role = result['role'] as String;

      await _storage.write(key: 'jwt_token', value: token);
      await _storage.write(key: 'user_role', value: role);

      state = AuthState(isLoading: false, isAuthenticated: true, error: null);
    } on AuthException catch (e) {
      state = AuthState(isLoading: false, isAuthenticated: false, error: e);
    } catch (e) {
      state = AuthState(isLoading: false, isAuthenticated: false, error: NetworkException());
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(repository, storage);
});
