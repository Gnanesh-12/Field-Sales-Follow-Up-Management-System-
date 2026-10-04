import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/email_provider.dart';

class EmailThreadPage
    extends ConsumerStatefulWidget {
  final String threadId;

  const EmailThreadPage({
    super.key,
    required this.threadId,
  });

  @override
  ConsumerState<EmailThreadPage>
      createState() =>
          _EmailThreadPageState();
}

class _EmailThreadPageState
    extends ConsumerState<
        EmailThreadPage> {
  final TextEditingController
      _replyController =
      TextEditingController();

  bool _sending =
      false;

  @override
  void initState() {
    super.initState();

    Future.microtask(
      () async {
        try {
          await ref
              .read(
                emailRepositoryProvider,
              )
              .markThreadRead(
                widget.threadId,
              );

          ref.invalidate(
            emailThreadProvider(
              widget.threadId,
            ),
          );
        } catch (_) {}
      },
    );
  }

  @override
  void dispose() {
    _replyController.dispose();

    super.dispose();
  }

  Future<void> _reply() async {
    final body =
        _replyController.text.trim();

    if (body.isEmpty) {
      return;
    }

    setState(() {
      _sending =
          true;
    });

    try {
      final result =
          await ref
              .read(
                emailRepositoryProvider,
              )
              .replyToThread(
                threadId:
                    widget.threadId,

                body:
                    body,
              );

      _replyController.clear();

      ref.invalidate(
        emailThreadProvider(
          widget.threadId,
        ),
      );

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          SnackBar(
            content:
                Text(
              result.status ==
                      'SENT'
                  ? 'Reply sent'
                  : 'Reply queued',
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          SnackBar(
            content:
                Text(
              error.toString(),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _sending =
              false;
        });
      }
    }
  }

  @override
  Widget build(
    BuildContext context,
  ) {
    final provider =
        ref.watch(
      emailThreadProvider(
        widget.threadId,
      ),
    );

    return Scaffold(
      appBar:
          AppBar(
        title:
            provider.when(
          loading:
              () => const Text(
            'Conversation',
          ),

          error:
              (_, _) =>
                  const Text(
            'Conversation',
          ),

          data:
              (conversation) =>
                  Text(
            conversation.subject ??
                '(No subject)',

            maxLines:
                1,

            overflow:
                TextOverflow.ellipsis,
          ),
        ),
      ),

      body:
          provider.when(
        loading:
            () => const Center(
          child:
              CircularProgressIndicator(),
        ),

        error:
            (error, stack) =>
                Center(
          child:
              Text(
            error.toString(),
          ),
        ),

        data:
            (conversation) {
          final canReply =
              conversation.messages.any(
            (message) =>
                message.direction ==
                'INBOUND',
          );

          return Column(
            children: [
              Expanded(
                child:
                    ListView.builder(
                  padding:
                      const EdgeInsets.all(
                    12,
                  ),

                  itemCount:
                      conversation
                          .messages
                          .length,

                  itemBuilder:
                      (
                    context,
                    index,
                  ) {
                    final message =
                        conversation
                            .messages[index];

                    final isOutbound =
                        message.direction ==
                            'OUTBOUND';

                    return Align(
                      alignment:
                          isOutbound
                              ? Alignment
                                  .centerRight
                              : Alignment
                                  .centerLeft,

                      child:
                          Container(
                        constraints:
                            BoxConstraints(
                          maxWidth:
                              MediaQuery.of(
                                    context,
                                  )
                                      .size
                                      .width *
                                  0.88,
                        ),

                        margin:
                            const EdgeInsets
                                .only(
                          bottom:
                              12,
                        ),

                        padding:
                            const EdgeInsets.all(
                          14,
                        ),

                        decoration:
                            BoxDecoration(
                          color:
                              isOutbound
                                  ? Theme.of(
                                      context,
                                    )
                                      .colorScheme
                                      .primaryContainer
                                  : Theme.of(
                                      context,
                                    )
                                      .colorScheme
                                      .surfaceContainerHighest,

                          borderRadius:
                              BorderRadius.circular(
                            14,
                          ),
                        ),

                        child:
                            Column(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,

                          children: [
                            Text(
                              message.fromEmail,

                              style:
                                  const TextStyle(
                                fontWeight:
                                    FontWeight.bold,

                                fontSize:
                                    12,
                              ),
                            ),

                            const SizedBox(
                              height:
                                  8,
                            ),

                            Text(
                              message.bodyText
                                          ?.isNotEmpty ==
                                      true
                                  ? message
                                      .bodyText!
                                  : message
                                          .snippet ??
                                      '',
                            ),

                            const SizedBox(
                              height:
                                  8,
                            ),

                            Text(
                              _formatDate(
                                message.sentAt,
                              ),

                              style:
                                  Theme.of(
                                context,
                              )
                                      .textTheme
                                      .bodySmall,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              SafeArea(
                child:
                    Padding(
                  padding:
                      const EdgeInsets.all(
                    10,
                  ),

                  child:
                      canReply
                          ? Row(
                              crossAxisAlignment:
                                  CrossAxisAlignment.end,

                              children: [
                                Expanded(
                                  child:
                                      TextField(
                                    controller:
                                        _replyController,

                                    maxLines:
                                        5,

                                    minLines:
                                        1,

                                    decoration:
                                        const InputDecoration(
                                      hintText:
                                          'Write a reply...',

                                      border:
                                          OutlineInputBorder(),
                                    ),
                                  ),
                                ),

                                const SizedBox(
                                  width:
                                      8,
                                ),

                                IconButton(
                                  onPressed:
                                      _sending
                                          ? null
                                          : _reply,

                                  icon:
                                      _sending
                                          ? const SizedBox(
                                              width:
                                                  22,

                                              height:
                                                  22,

                                              child:
                                                  CircularProgressIndicator(
                                                strokeWidth:
                                                    2,
                                              ),
                                            )
                                          : const Icon(
                                              Icons.send,
                                            ),
                                ),
                              ],
                            )
                          : const Padding(
                              padding:
                                  EdgeInsets.all(
                                12,
                              ),

                              child:
                                  Text(
                                'Reply will be available when the customer responds.',
                                textAlign:
                                    TextAlign.center,
                              ),
                            ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _formatDate(
    DateTime date,
  ) {
    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year} '
        '${date.hour.toString().padLeft(2, '0')}:'
        '${date.minute.toString().padLeft(2, '0')}';
  }
}