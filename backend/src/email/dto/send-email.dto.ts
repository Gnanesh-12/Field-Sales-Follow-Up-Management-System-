export class SendEmailDto {
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  customerSiteId?: string;
  attachmentUrls?: string[];  // URLs of existing Vercel Blob attachments
}

export class SendVisitReportDto {
  fieldVisitId: string;
  recipientEmail: string;
  cc?: string[];
  additionalNotes?: string;
  includePhotos?: boolean;  // Include field visit photographs
}
