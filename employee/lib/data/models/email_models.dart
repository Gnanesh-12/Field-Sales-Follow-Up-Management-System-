/// Models for the Phase 1 Email Integration feature.

class GmailConnectionStatus {
  final bool connected;
  final String? gmailAddress;
  final DateTime? connectedAt;

  GmailConnectionStatus({
    required this.connected,
    this.gmailAddress,
    this.connectedAt,
  });

  factory GmailConnectionStatus.fromJson(Map<String, dynamic> json) {
    return GmailConnectionStatus(
      connected: json['connected'] ?? false,
      gmailAddress: json['gmailAddress'],
      connectedAt: json['connectedAt'] != null
          ? DateTime.parse(json['connectedAt']).toLocal()
          : null,
    );
  }
}

class EmailLogEntry {
  final String id;
  final String recipientEmail;
  final String subject;
  final String status; // QUEUED, SENT, FAILED
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

  factory EmailLogEntry.fromJson(Map<String, dynamic> json) {
    return EmailLogEntry(
      id: json['id'],
      recipientEmail: json['recipientEmail'],
      subject: json['subject'],
      status: json['status'],
      sentAt: json['sentAt'] != null ? DateTime.parse(json['sentAt']).toLocal() : null,
      createdAt: DateTime.parse(json['createdAt']).toLocal(),
      isVisitReport: json['isVisitReport'] ?? false,
      attachmentCount: json['attachmentCount'] ?? 0,
      customerSiteName: json['customerSite']?['name'],
      customerSiteId: json['customerSite']?['id'],
      fieldVisitId: json['fieldVisitId'],
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

  factory EmailDetail.fromJson(Map<String, dynamic> json) {
    return EmailDetail(
      id: json['id'],
      senderEmail: json['senderEmail'],
      recipientEmail: json['recipientEmail'],
      ccEmails: json['ccEmails'] != null
          ? List<String>.from(json['ccEmails'])
          : [],
      subject: json['subject'],
      bodyPreview: json['bodyPreview'],
      status: json['status'],
      errorMessage: json['errorMessage'],
      attachmentCount: json['attachmentCount'] ?? 0,
      isVisitReport: json['isVisitReport'] ?? false,
      fieldVisitId: json['fieldVisitId'],
      customerSiteName: json['customerSite']?['name'],
      sentAt: json['sentAt'] != null ? DateTime.parse(json['sentAt']).toLocal() : null,
      createdAt: DateTime.parse(json['createdAt']).toLocal(),
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

  factory SendEmailResult.fromJson(Map<String, dynamic> json) {
    return SendEmailResult(
      id: json['id'],
      status: json['status'],
      gmailMessageId: json['gmailMessageId'],
    );
  }
}
