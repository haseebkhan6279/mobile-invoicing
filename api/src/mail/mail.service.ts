import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {}

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>("SMTP_HOST");
    const port = Number(this.config.get<string>("SMTP_PORT") ?? 587);
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");
    if (!host || !user || !pass) {
      throw new InternalServerErrorException(
        "Email sending is not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS)",
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.config.get<string>("SMTP_SECURE") === "true" || port === 465,
      auth: { user, pass },
    });
    return this.transporter;
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: Buffer; contentType?: string }[];
  }) {
    const from = this.config.get<string>("MAIL_FROM") || this.config.get<string>("SMTP_USER");
    await this.getTransporter().sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
  }
}
