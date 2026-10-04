class GmailConnectionStatus {
  final bool connected;
  final String? gmailAddress;
  final DateTime? connectedAt;
  final DateTime? lastSyncedAt;

  GmailConnectionStatus({
    required this.connected,
    this.gmailAddress,
    this.connectedAt,
    this.lastSyncedAt,
  });

  factory GmailConnectionStatus.fromJson(
    Map<String, dynamic> json,
  ) {
    return GmailConnectionStatus(
      connected:
          json['connected'] ?? false,
      gmailAddress:
          json['gmailAddress'],
      connectedAt:
          json['connectedAt'] != null
              ? DateTime.parse(
                  json['connectedAt'],
                ).toLocal()
              : null,
      lastSyncedAt:
          json['lastSyncedAt'] != null
              ? DateTime.parse(
                  json['lastSyncedAt'],
                ).toLocal()
              : null,
    );
  }
}

class EmailLogEntry {
  final String id;
  final String recipientEmail;
  final String subject;
  final String status;
  final DateTime? sentAt;
  final DateTime createdAt;
  final bool isVisitReport;
  final int attachmentCount;
  final String? customerSiteName;
  final String? customerSiteId;
  final String? fieldVisitId;

  EmailLogEntry({
    required this.id,
    required this.recipientEmail,
    required this.subject,
    required this.status,
    this.sentAt,
    required this.createdAt,
    required this.isVisitReport,
    required this.attachmentCount,
    this.customerSiteName,
    this.customerSiteId,
    this.fieldVisitId,
  });

  factory EmailLogEntry.fromJson(
    Map<String, dynamic> json,
  ) {
    return EmailLogEntry(
      id:
          json['id']?.toString() ??
              '',

      recipientEmail:
          json['recipientEmail']
                  ?.toString() ??
              '',

      subject:
          json['subject']?.toString() ??
              '',

      status:
          json['status']?.toString() ??
              'UNKNOWN',

      sentAt:
          json['sentAt'] != null
              ? DateTime.parse(
                  json['sentAt'].toString(),
                ).toLocal()
              : null,

      createdAt:
          DateTime.parse(
            json['createdAt'].toString(),
          ).toLocal(),

      isVisitReport:
          json['isVisitReport'] ??
              false,

      attachmentCount:
          _parseInt(
        json['attachmentCount'],
      ),

      customerSiteName:
          json['customerSite']
              is Map
          ? json['customerSite']
              ['name']
          : null,

      customerSiteId:
          json['customerSite']
              is Map
          ? json['customerSite']
              ['id']
          : null,

      fieldVisitId:
          json['fieldVisitId']
              ?.toString(),
    );
  }
}

class EmailDetail {
  final String id;
  final String senderEmail;
  final String recipientEmail;
  final List<String> ccEmails;
  final String subject;
  final String? bodyPreview;
  final String status;
  final String? errorMessage;
  final int attachmentCount;
  final bool isVisitReport;
  final String? fieldVisitId;
  final String? customerSiteName;
  final DateTime? sentAt;
  final DateTime createdAt;

  EmailDetail({
    required this.id,
    required this.senderEmail,
    required this.recipientEmail,
    required this.ccEmails,
    required this.subject,
    this.bodyPreview,
    required this.status,
    this.errorMessage,
    required this.attachmentCount,
    required this.isVisitReport,
    this.fieldVisitId,
    this.customerSiteName,
    this.sentAt,
    required this.createdAt,
  });

  factory EmailDetail.fromJson(
    Map<String, dynamic> json,
  ) {
    final customerSite =
        json['customerSite'];

    return EmailDetail(
      id:
          json['id']?.toString() ??
              '',

      senderEmail:
          json['senderEmail']
                  ?.toString() ??
              '',

      recipientEmail:
          json['recipientEmail']
                  ?.toString() ??
              '',

      ccEmails:
          json['ccEmails'] is List
              ? List<String>.from(
                  json['ccEmails'].map(
                    (item) =>
                        item.toString(),
                  ),
                )
              : [],

      subject:
          json['subject']?.toString() ??
              '',

      bodyPreview:
          json['bodyPreview']
              ?.toString(),

      status:
          json['status']?.toString() ??
              'UNKNOWN',

      errorMessage:
          json['errorMessage']
              ?.toString(),

      attachmentCount:
          _parseInt(
        json['attachmentCount'],
      ),

      isVisitReport:
          json['isVisitReport'] ??
              false,

      fieldVisitId:
          json['fieldVisitId']
              ?.toString(),

      customerSiteName:
          customerSite is Map
              ? customerSite[
                  'name']
              : null,

      sentAt:
          json['sentAt'] != null
              ? DateTime.parse(
                  json['sentAt']
                      .toString(),
                ).toLocal()
              : null,

      createdAt:
          DateTime.parse(
            json['createdAt']
                .toString(),
          ).toLocal(),
    );
  }
}

/**
 * Safe response model for send/reply/forward.
 *
 * The backend now returns these fields at the top level.
 *
 * It also understands the old:
 *
 * {
 *   "success": true,
 *   "message": {...}
 * }
 *
 * shape so an older backend won't crash the Flutter client.
 */
class SendEmailResult {
  final String id;
  final String status;
  final String? gmailMessageId;
  final String? threadId;

  SendEmailResult({
    required this.id,
    required this.status,
    this.gmailMessageId,
    this.threadId,
  });

  factory SendEmailResult.fromJson(
    Map<String, dynamic> json,
  ) {
    final message =
        json['message'] is Map
            ? Map<String, dynamic>.from(
                json['message'],
              )
            : null;

    final idValue =
        json['id'] ??
            message?['id'] ??
            '';

    final statusValue =
        json['status'] ??
            (json['success'] == true
                ? 'SENT'
                : 'FAILED');

    final gmailMessageId =
        json['gmailMessageId'] ??
            message?[
                'gmailMessageId'];

    final threadId =
        json['threadId'] ??
            message?[
                'gmailThreadId'];

    return SendEmailResult(
      id:
          idValue.toString(),

      status:
          statusValue.toString(),

      gmailMessageId:
          gmailMessageId
              ?.toString(),

      threadId:
          threadId?.toString(),
    );
  }
}

class EmailThreadModel {
  final String id;
  final String gmailThreadId;
  final String? customerSiteId;
  final String? subject;
  final List<String> participants;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final String? customerSiteName;
  final String? customerSiteEmail;
  final EmailMessageModel? latestMessage;

  EmailThreadModel({
    required this.id,
    required this.gmailThreadId,
    this.customerSiteId,
    this.subject,
    required this.participants,
    this.lastMessageAt,
    required this.unreadCount,
    this.customerSiteName,
    this.customerSiteEmail,
    this.latestMessage,
  });

  factory EmailThreadModel.fromJson(
    Map<String, dynamic> json,
  ) {
    final messages =
        json['messages'] is List
            ? json['messages']
                as List
            : <dynamic>[];

    return EmailThreadModel(
      id:
          json['id']?.toString() ??
              '',

      gmailThreadId:
          json['gmailThreadId']
                  ?.toString() ??
              '',

      customerSiteId:
          json['customerSiteId']
              ?.toString(),

      subject:
          json['subject']
              ?.toString(),

      participants:
          json['participants'] is List
              ? List<String>.from(
                  json['participants'].map(
                    (item) =>
                        item.toString(),
                  ),
                )
              : [],

      lastMessageAt:
          json['lastMessageAt'] !=
                  null
              ? DateTime.parse(
                  json['lastMessageAt']
                      .toString(),
                ).toLocal()
              : null,

      unreadCount:
          _parseInt(
        json['unreadCount'],
      ),

      customerSiteName:
          json['customerSite'] is Map
              ? json['customerSite']
                  ['name']
              : null,

      customerSiteEmail:
          json['customerSite'] is Map
              ? json['customerSite']
                  ['email']
              : null,

      latestMessage:
          messages.isNotEmpty
              ? EmailMessageModel
                  .fromJson(
                  Map<String,
                      dynamic>.from(
                    messages.first,
                  ),
                )
              : null,
    );
  }
}

class EmailMessageModel {
  final String id;
  final String gmailMessageId;
  final String gmailThreadId;
  final String direction;
  final String fromEmail;
  final List<String> toEmails;
  final List<String> ccEmails;
  final String? subject;
  final String? bodyText;
  final String? bodyHtml;
  final String? snippet;
  final String? messageId;
  final String? inReplyTo;
  final String? references;
  final bool isRead;
  final DateTime sentAt;

  EmailMessageModel({
    required this.id,
    required this.gmailMessageId,
    required this.gmailThreadId,
    required this.direction,
    required this.fromEmail,
    required this.toEmails,
    required this.ccEmails,
    this.subject,
    this.bodyText,
    this.bodyHtml,
    this.snippet,
    this.messageId,
    this.inReplyTo,
    this.references,
    required this.isRead,
    required this.sentAt,
  });

  factory EmailMessageModel.fromJson(
    Map<String, dynamic> json,
  ) {
    return EmailMessageModel(
      id:
          json['id']?.toString() ??
              '',

      gmailMessageId:
          json['gmailMessageId']
                  ?.toString() ??
              '',

      gmailThreadId:
          json['gmailThreadId']
                  ?.toString() ??
              '',

      direction:
          json['direction']
                  ?.toString() ??
              'UNKNOWN',

      fromEmail:
          json['fromEmail']
                  ?.toString() ??
              '',

      toEmails:
          json['toEmails'] is List
              ? List<String>.from(
                  json['toEmails'].map(
                    (item) =>
                        item.toString(),
                  ),
                )
              : [],

      ccEmails:
          json['ccEmails'] is List
              ? List<String>.from(
                  json['ccEmails'].map(
                    (item) =>
                        item.toString(),
                  ),
                )
              : [],

      subject:
          json['subject']
              ?.toString(),

      bodyText:
          json['bodyText']
              ?.toString(),

      bodyHtml:
          json['bodyHtml']
              ?.toString(),

      snippet:
          json['snippet']
              ?.toString(),

      messageId:
          json['messageId']
              ?.toString(),

      inReplyTo:
          json['inReplyTo']
              ?.toString(),

      references:
          json['references']
              ?.toString(),

      isRead:
          json['isRead'] ??
              false,

      sentAt:
          DateTime.parse(
            json['sentAt']
                .toString(),
          ).toLocal(),
    );
  }
}

class EmailConversation {
  final String id;
  final String gmailThreadId;
  final String? customerSiteId;
  final String? customerSiteName;
  final String? customerSiteEmail;
  final String? subject;
  final List<EmailMessageModel> messages;

  EmailConversation({
    required this.id,
    required this.gmailThreadId,
    this.customerSiteId,
    this.customerSiteName,
    this.customerSiteEmail,
    this.subject,
    required this.messages,
  });

  factory EmailConversation.fromJson(
    Map<String, dynamic> json,
  ) {
    return EmailConversation(
      id:
          json['id']?.toString() ??
              '',

      gmailThreadId:
          json['gmailThreadId']
                  ?.toString() ??
              '',

      customerSiteId:
          json['customerSiteId']
              ?.toString(),

      customerSiteName:
          json['customerSite'] is Map
              ? json['customerSite']
                  ['name']
              : null,

      customerSiteEmail:
          json['customerSite'] is Map
              ? json['customerSite']
                  ['email']
              : null,

      subject:
          json['subject']
              ?.toString(),

      messages:
          (json['messages'] is List
                  ? json['messages']
                      as List
                  : <dynamic>[])
              .map(
                (item) =>
                    EmailMessageModel
                        .fromJson(
                  Map<String,
                      dynamic>.from(
                    item,
                  ),
                ),
              )
              .toList(),
    );
  }
}

class EmailReminder {
  final String id;
  final DateTime dueDate;
  final String status;
  final String? notes;
  final String fieldVisitId;
  final String? customerSiteName;
  final String? customerSiteEmail;
  final bool overdue;

  EmailReminder({
    required this.id,
    required this.dueDate,
    required this.status,
    this.notes,
    required this.fieldVisitId,
    this.customerSiteName,
    this.customerSiteEmail,
    required this.overdue,
  });

  factory EmailReminder.fromJson(
    Map<String, dynamic> json,
  ) {
    return EmailReminder(
      id:
          json['id']?.toString() ??
              '',

      dueDate:
          DateTime.parse(
            json['dueDate']
                .toString(),
          ).toLocal(),

      status:
          json['status']?.toString() ??
              'pending',

      notes:
          json['notes']
              ?.toString(),

      fieldVisitId:
          json['fieldVisitId']
                  ?.toString() ??
              '',

      customerSiteName:
          json['customerSite'] is Map
              ? json['customerSite']
                  ['name']
              : null,

      customerSiteEmail:
          json['customerSite'] is Map
              ? json['customerSite']
                  ['email']
              : null,

      overdue:
          json['overdue'] ??
              false,
    );
  }
}

int _parseInt(
  dynamic value,
) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(
        value?.toString() ??
            '',
      ) ??
      0;
}