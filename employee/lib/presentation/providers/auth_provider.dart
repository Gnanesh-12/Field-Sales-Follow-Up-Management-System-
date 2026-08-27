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
  final bool isFirstLogin;

  AuthState({
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
    this.isFirstLogin = false,
  });

  AuthState copyWith({
    bool? isLoading,
    AuthException? error,
    bool? isAuthenticated,
    bool? isFirstLogin,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isFirstLogin: isFirstLogin ?? this.isFirstLogin,
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
      final isFirstLogin = result['isFirstLogin'] as bool;

      await _storage.write(key: 'jwt_token', value: token);
      await _storage.write(key: 'user_role', value: role);
      await _storage.write(key: 'employee_id', value: employeeId); // Need this for reset

      state = AuthState(isLoading: false, isAuthenticated: true, isFirstLogin: isFirstLogin, error: null);
    } on AuthException catch (e) {
      state = AuthState(isLoading: false, isAuthenticated: false, error: e);
    } catch (e) {
      state = AuthState(isLoading: false, isAuthenticated: false, error: NetworkException());
    }
  }

  Future<bool> resetPassword(String employeeId, String oldPin, String newPin) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.resetPassword(employeeId, oldPin, newPin);
      state = state.copyWith(isLoading: false, isFirstLogin: false);
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: NetworkException());
      return false;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(repository, storage);
});
