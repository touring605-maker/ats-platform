import { db } from "@workspace/db";
import { emailLogsTable } from "@workspace/db/schema";
import { logger } from "./logger";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

export interface IEmailService {
  send(message: EmailMessage): Promise<{ messageId: string }>;
  sendBatch(messages: EmailMessage[]): Promise<Array<{ messageId: string }>>;
}

export class ConsoleEmailService implements IEmailService {
  async send(message: EmailMessage): Promise<{ messageId: string }> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const recipients = Array.isArray(message.to) ? message.to.join(", ") : message.to;

    logger.info(
      { messageId, to: recipients, subject: message.subject },
      "[EMAIL] Sending email"
    );

    logger.debug(
      { messageId, htmlBody: message.htmlBody?.substring(0, 200) },
      "[EMAIL] Email body preview"
    );

    return { messageId };
  }

  async sendBatch(messages: EmailMessage[]): Promise<Array<{ messageId: string }>> {
    const results: Array<{ messageId: string }> = [];
    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }
    return results;
  }
}

const emailService = new ConsoleEmailService();

export function renderTemplate(
  template: string,
  mergeData: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(mergeData)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return rendered;
}

export interface SendEmailOptions {
  organizationId: string;
  applicationId?: string;
  candidateId?: string;
  templateId?: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  sentBy?: string;
}

export interface SendEmailResult {
  emailLogId: string;
  status: "sent" | "failed";
  errorMessage?: string;
}

export async function sendAndLogEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  let status: "sent" | "failed" = "sent";
  let errorMessage: string | undefined;

  try {
    await emailService.send({
      to: options.toEmail,
      subject: options.subject,
      htmlBody: options.htmlBody,
      textBody: options.textBody,
    });
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "[EMAIL] Failed to send email");
  }

  const [log] = await db
    .insert(emailLogsTable)
    .values({
      organizationId: options.organizationId,
      applicationId: options.applicationId || null,
      candidateId: options.candidateId || null,
      templateId: options.templateId || null,
      toEmail: options.toEmail,
      subject: options.subject,
      htmlBody: options.htmlBody,
      textBody: options.textBody,
      status,
      sentBy: options.sentBy || null,
      errorMessage: errorMessage || null,
    })
    .returning();

  return { emailLogId: log.id, status, errorMessage };
}

export { emailService };
