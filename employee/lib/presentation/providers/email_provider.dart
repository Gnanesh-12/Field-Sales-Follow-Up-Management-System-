// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import '../../data/email_repository.dart';
// import '../../data/models/email_models.dart';
// import 'auth_provider.dart';
// import 'api_provider.dart';

// // ─── Email Repository Provider ──────────────────────────────────

// final emailRepositoryProvider = Provider<EmailRepository>((ref) {
//   final client = ref.watch(httpClientProvider);
//   final storage = ref.watch(secureStorageProvider);
//   return EmailRepository(client: client, storage: storage);
// });

// // ─── Gmail Connection Status ────────────────────────────────────

// final gmailStatusProvider = FutureProvider.autoDispose<GmailConnectionStatus>((ref) async {
//   final repo = ref.watch(emailRepositoryProvider);
//   return repo.getGmailStatus();
// });

// // ─── Email History ──────────────────────────────────────────────

// final emailHistoryProvider = FutureProvider.autoDispose
//     .family<Map<String, dynamic>, int>((ref, page) async {
//   final repo = ref.watch(emailRepositoryProvider);
//   return repo.getEmailHistory(page: page);
// });

// // ─── Email Detail ───────────────────────────────────────────────

// final emailDetailProvider = FutureProvider.autoDispose
//     .family<EmailDetail, String>((ref, emailId) async {
//   final repo = ref.watch(emailRepositoryProvider);
//   return repo.getEmailDetail(emailId);
// });


import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';
import '../../data/email_repository.dart';
import '../../data/models/email_models.dart';
import 'api_provider.dart';

final emailRepositoryProvider =
    Provider<EmailRepository>((ref) {
  final client =
      ref.watch(httpClientProvider);

  final storage =
      ref.watch(secureStorageProvider);

  return EmailRepository(
    client: client,
    storage: storage,
  );
});

final gmailStatusProvider =
    FutureProvider.autoDispose<
        GmailConnectionStatus>(
  (ref) async {
    final repo =
        ref.watch(
      emailRepositoryProvider,
    );

    return repo.getGmailStatus();
  },
);

final emailHistoryProvider =
    FutureProvider.autoDispose
        .family<
            Map<String, dynamic>,
            int>(
  (ref, page) async {
    final repo =
        ref.watch(
      emailRepositoryProvider,
    );

    return repo.getEmailHistory(
      page: page,
    );
  },
);

final emailDetailProvider =
    FutureProvider.autoDispose
        .family<
            EmailDetail,
            String>(
  (ref, emailId) async {
    final repo =
        ref.watch(
      emailRepositoryProvider,
    );

    return repo.getEmailDetail(
      emailId,
    );
  },
);

final emailInboxProvider =
    FutureProvider.autoDispose
        .family<
            Map<String, dynamic>,
            int>(
  (ref, page) async {
    final repo =
        ref.watch(
      emailRepositoryProvider,
    );

    return repo.getInbox(
      page: page,
    );
  },
);

final emailThreadProvider =
    FutureProvider.autoDispose
        .family<
            EmailConversation,
            String>(
  (ref, threadId) async {
    final repo =
        ref.watch(
      emailRepositoryProvider,
    );

    return repo.getEmailThread(
      threadId,
    );
  },
);

final emailRemindersProvider =
    FutureProvider.autoDispose<
        List<EmailReminder>>(
  (ref) async {
    final repo =
        ref.watch(
      emailRepositoryProvider,
    );

    return repo.getReminders();
  },
);