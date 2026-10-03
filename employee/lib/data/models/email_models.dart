// /// Models for the Phase 1 Email Integration feature.

// class GmailConnectionStatus {
//   final bool connected;
//   final String? gmailAddress;
//   final DateTime? connectedAt;

//   GmailConnectionStatus({
//     required this.connected,
//     this.gmailAddress,
//     this.connectedAt,
//   });

//   factory GmailConnectionStatus.fromJson(Map<String, dynamic> json) {
//     return GmailConnectionStatus(
//       connected: json['connected'] ?? false,
//       gmailAddress: json['gmailAddress'],
//       connectedAt: json['connectedAt'] != null
//           ? DateTime.parse(json['connectedAt']).toLocal()
//           : null,
//     );
//   }
// }

// class EmailLogEntry {
//   final String id;
//   final String recipientEmail;
//   final String subject;
//   final String status; // QUEUED, SENT, FAILED
//   final DateTime? sentAt;
//   final DateTime createdAt;
//   final bool isVisitReport;
//   final int attachmentCount;
//   final String? customerSiteName;
//   final String? customerSiteId;
//   final String? fieldVisitId;

//   EmailLogEntry({
//     required this.id,
//     required this.recipientEmail,
//     required this.subject,
//     required this.status,
//     this.sentAt,
//     required this.createdAt,
//     required this.isVisitReport,
//     required this.attachmentCount,
//     this.customerSiteName,
//     this.customerSiteId,
//     this.fieldVisitId,
//   });

//   factory EmailLogEntry.fromJson(Map<String, dynamic> json) {
//     return EmailLogEntry(
//       id: json['id'],
//       recipientEmail: json['recipientEmail'],
//       subject: json['subject'],
//       status: json['status'],
//       sentAt: json['sentAt'] != null ? DateTime.parse(json['sentAt']).toLocal() : null,
//       createdAt: DateTime.parse(json['createdAt']).toLocal(),
//       isVisitReport: json['isVisitReport'] ?? false,
//       attachmentCount: json['attachmentCount'] ?? 0,
//       customerSiteName: json['customerSite']?['name'],
//       customerSiteId: json['customerSite']?['id'],
//       fieldVisitId: json['fieldVisitId'],
//     );
//   }
// }

// class EmailDetail {
//   final String id;
//   final String senderEmail;
//   final String recipientEmail;
//   final List<String> ccEmails;
//   final String subject;
//   final String? bodyPreview;
//   final String status;
//   final String? errorMessage;
//   final int attachmentCount;
//   final bool isVisitReport;
//   final String? fieldVisitId;
//   final String? customerSiteName;
//   final DateTime? sentAt;
//   final DateTime createdAt;

//   EmailDetail({
//     required this.id,
//     required this.senderEmail,
//     required this.recipientEmail,
//     required this.ccEmails,
//     required this.subject,
//     this.bodyPreview,
//     required this.status,
//     this.errorMessage,
//     required this.attachmentCount,
//     required this.isVisitReport,
//     this.fieldVisitId,
//     this.customerSiteName,
//     this.sentAt,
//     required this.createdAt,
//   });

//   factory EmailDetail.fromJson(Map<String, dynamic> json) {
//     return EmailDetail(
//       id: json['id'],
//       senderEmail: json['senderEmail'],
//       recipientEmail: json['recipientEmail'],
//       ccEmails: json['ccEmails'] != null
//           ? List<String>.from(json['ccEmails'])
//           : [],
//       subject: json['subject'],
//       bodyPreview: json['bodyPreview'],
//       status: json['status'],
//       errorMessage: json['errorMessage'],
//       attachmentCount: json['attachmentCount'] ?? 0,
//       isVisitReport: json['isVisitReport'] ?? false,
//       fieldVisitId: json['fieldVisitId'],
//       customerSiteName: json['customerSite']?['name'],
//       sentAt: json['sentAt'] != null ? DateTime.parse(json['sentAt']).toLocal() : null,
//       createdAt: DateTime.parse(json['createdAt']).toLocal(),
//     );
//   }
// }

// class SendEmailResult {
//   final String id;
//   final String status;
//   final String? gmailMessageId;

//   SendEmailResult({
//     required this.id,
//     required this.status,
//     this.gmailMessageId,
//   });

//   factory SendEmailResult.fromJson(Map<String, dynamic> json) {
//     return SendEmailResult(
//       id: json['id'],
//       status: json['status'],
//       gmailMessageId: json['gmailMessageId'],
//     );
//   }
// }


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
      connected: json['connected'] ?? false,
      gmailAddress: json['gmailAddress'],
      connectedAt: json['connectedAt'] != null
          ? DateTime.parse(json['connectedAt']).toLocal()
          : null,
      lastSyncedAt: json['lastSyncedAt'] != null
          ? DateTime.parse(json['lastSyncedAt']).toLocal()
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
      id: json['id'],
      recipientEmail: json['recipientEmail'],
      subject: json['subject'],
      status: json['status'],
      sentAt: json['sentAt'] != null
          ? DateTime.parse(json['sentAt']).toLocal()
          : null,
      createdAt: DateTime.parse(
        json['createdAt'],
      ).toLocal(),
      // isVisitReport:
      //     json['isVisitReport'] ?? false,
      // attachmentCount:
      //     json['attachmentCount'] ?? 0,
      // customerSiteName:
      //     json['customerSite']?['name'],
      // customerSiteId:
      //     json['customerSite']?['id'],
      // fieldVisitId:
      //     json['fieldVisitId'],
      isVisitReport:
          json['isVisitReport'] ?? false,
      attachmentCount: json['attachmentCount'] is String
          ? int.tryParse(json['attachmentCount']) ?? 0
          : (json['attachmentCount'] as int? ?? 0),
      customerSiteName:
          json['customerSite']?['name'],
      customerSiteId:
          json['customerSite']?['id'],
      fieldVisitId:
          json['fieldVisitId'],
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
    return EmailDetail(
      id: json['id'],
      senderEmail: json['senderEmail'],
      recipientEmail:
          json['recipientEmail'],
      ccEmails: json['ccEmails'] != null
          ? List<String>.from(
              json['ccEmails'],
            )
          : [],
      subject: json['subject'],
      bodyPreview:
          json['bodyPreview'],
      status: json['status'],
      errorMessage:
          json['errorMessage'],
      // attachmentCount:
      //     json['attachmentCount'] ?? 0,
      // isVisitReport:
      attachmentCount: json['attachmentCount'] is String
          ? int.tryParse(json['attachmentCount']) ?? 0
          : (json['attachmentCount'] as int? ?? 0),
      isVisitReport:
          json['isVisitReport'] ?? false,
      fieldVisitId:
          json['fieldVisitId'],
      customerSiteName:
          json['customerSite']?['name'],
      sentAt: json['sentAt'] != null
          ? DateTime.parse(
              json['sentAt'],
            ).toLocal()
          : null,
      createdAt: DateTime.parse(
        json['createdAt'],
      ).toLocal(),
    );
  }
}

class SendEmailResult {
  final String id;
  final String status;
  final String? gmailMessageId;

  SendEmailResult({
    required this.id,
    required this.status,
    this.gmailMessageId,
  });

  factory SendEmailResult.fromJson(
    Map<String, dynamic> json,
  ) {
    return SendEmailResult(
      id: json['id'],
      status: json['status'],
      gmailMessageId:
          json['gmailMessageId'],
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
        json['messages'] as List?;

    return EmailThreadModel(
      id: json['id'],
      gmailThreadId:
          json['gmailThreadId'],
      customerSiteId:
          json['customerSiteId'],
      subject: json['subject'],
      participants:
          List<String>.from(
        json['participants'] ?? [],
      ),
      lastMessageAt:
          json['lastMessageAt'] != null
              ? DateTime.parse(
                  json['lastMessageAt'],
                ).toLocal()
              : null,
      // unreadCount:
      //     json['unreadCount'] ?? 0,
      unreadCount: json['unreadCount'] is String
          ? int.tryParse(json['unreadCount']) ?? 0
          : (json['unreadCount'] as int? ?? 0),
      customerSiteName:
          json['customerSite']?['name'],
      customerSiteEmail:
          json['customerSite']?['email'],
      latestMessage:
          messages != null &&
                  messages.isNotEmpty
              ? EmailMessageModel.fromJson(
                  messages.first,
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
      id: json['id'],
      gmailMessageId:
          json['gmailMessageId'],
      gmailThreadId:
          json['gmailThreadId'],
      direction:
          json['direction'],
      fromEmail:
          json['fromEmail'],
      toEmails:
          List<String>.from(
        json['toEmails'] ?? [],
      ),
      ccEmails:
          List<String>.from(
        json['ccEmails'] ?? [],
      ),
      subject:
          json['subject'],
      bodyText:
          json['bodyText'],
      bodyHtml:
          json['bodyHtml'],
      snippet:
          json['snippet'],
      messageId:
          json['messageId'],
      inReplyTo:
          json['inReplyTo'],
      references:
          json['references'],
      isRead:
          json['isRead'] ?? false,
      sentAt: DateTime.parse(
        json['sentAt'],
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
      id: json['id'],
      gmailThreadId:
          json['gmailThreadId'],
      customerSiteId:
          json['customerSiteId'],
      customerSiteName:
          json['customerSite']?['name'],
      customerSiteEmail:
          json['customerSite']?['email'],
      subject:
          json['subject'],
      messages:
          (json['messages'] as List? ?? [])
              .map(
                (item) =>
                    EmailMessageModel.fromJson(
                  item,
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
      id: json['id'],
      dueDate: DateTime.parse(
        json['dueDate'],
      ).toLocal(),
      status:
          json['status'] ?? 'pending',
      notes: json['notes'],
      fieldVisitId:
          json['fieldVisitId'],
      customerSiteName:
          json['customerSite']?['name'],
      customerSiteEmail:
          json['customerSite']?['email'],
      overdue:
          json['overdue'] ?? false,
    );
  }
}