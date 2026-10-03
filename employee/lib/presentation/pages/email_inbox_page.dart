import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/email_provider.dart';
import 'email_thread_page.dart';

class EmailInboxPage extends ConsumerWidget {
  const EmailInboxPage({
    super.key,
  });

  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) {
    final inbox =
        ref.watch(
      emailInboxProvider(1),
    );

    return Scaffold(
      appBar: AppBar(
        title:
            const Text('Inbox'),
        actions: [
          IconButton(
            icon:
                const Icon(Icons.sync),
            onPressed: () async {
              try {
                await ref
                    .read(
                      emailRepositoryProvider,
                    )
                    .syncInbox();

                ref.invalidate(
                  emailInboxProvider(1),
                );

                if (context.mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Inbox synchronized',
                      ),
                    ),
                  );
                }
              } catch (error) {
                if (context.mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(
                    SnackBar(
                      content: Text(
                        error.toString(),
                      ),
                    ),
                  );
                }
              }
            },
          ),
        ],
      ),
      body: inbox.when(
        loading: () =>
            const Center(
          child:
              CircularProgressIndicator(),
        ),
        error: (error, stack) =>
            Center(
          child: Padding(
            padding:
                const EdgeInsets.all(
              24,
            ),
            child: Text(
              error.toString(),
              textAlign:
                  TextAlign.center,
            ),
          ),
        ),
        data: (data) {
          final threads =
              data['threads'] as List;

          if (threads.isEmpty) {
            return const Center(
              child: Text(
                'No email conversations found.',
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref.refresh(
                emailInboxProvider(1)
                    .future,
              );
            },
            child: ListView.separated(
              padding:
                  const EdgeInsets.all(
                12,
              ),
              itemCount:
                  threads.length,
              separatorBuilder:
                  (_, __) =>
                      const Divider(
                height: 1,
              ),
              itemBuilder:
                  (context, index) {
                final thread =
                    threads[index];

                final subject =
                    thread.subject ??
                        '(No subject)';

                final customer =
                    thread.customerSiteName ??
                        thread.customerSiteEmail ??
                        thread.participants
                            .join(', ');

                final latest =
                    thread.latestMessage;

                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  leading:
                      CircleAvatar(
                    child: Text(
                      customer
                              .isNotEmpty
                          ? customer[0]
                              .toUpperCase()
                          : '?',
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          subject,
                          maxLines: 1,
                          overflow:
                              TextOverflow
                                  .ellipsis,
                          style:
                              TextStyle(
                            fontWeight:
                                thread.unreadCount >
                                        0
                                    ? FontWeight
                                        .bold
                                    : FontWeight
                                        .normal,
                          ),
                        ),
                      ),
                      if (thread.unreadCount >
                          0)
                        Container(
                          padding:
                              const EdgeInsets
                                  .symmetric(
                            horizontal: 7,
                            vertical: 3,
                          ),
                          decoration:
                              BoxDecoration(
                            color:
                                Theme.of(
                              context,
                            ).colorScheme.primary,
                            borderRadius:
                                BorderRadius
                                    .circular(
                              10,
                            ),
                          ),
                          child: Text(
                            '${thread.unreadCount}',
                            style:
                                const TextStyle(
                              color:
                                  Colors.white,
                              fontSize: 11,
                            ),
                          ),
                        ),
                    ],
                  ),
                  subtitle:
                      Column(
                    crossAxisAlignment:
                        CrossAxisAlignment
                            .start,
                    children: [
                      const SizedBox(
                        height: 4,
                      ),
                      Text(
                        customer,
                        maxLines: 1,
                        overflow:
                            TextOverflow
                                .ellipsis,
                      ),
                      if (latest
                              ?.snippet
                              ?.isNotEmpty ==
                          true)
                        Text(
                          latest!.snippet!,
                          maxLines: 1,
                          overflow:
                              TextOverflow
                                  .ellipsis,
                          style:
                              Theme.of(
                            context,
                          ).textTheme.bodySmall,
                        ),
                    ],
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder:
                            (_) =>
                                EmailThreadPage(
                          threadId:
                              thread.id,
                        ),
                      ),
                    ).then(
                      (_) {
                        ref.invalidate(
                          emailInboxProvider(
                            1,
                          ),
                        );
                      },
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}