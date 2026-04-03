export interface EmailMessage {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface IEmailService {
  send(message: EmailMessage): Promise<{ messageId: string }>;
  sendBatch(messages: EmailMessage[]): Promise<Array<{ messageId: string }>>;
}
