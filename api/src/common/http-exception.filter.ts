import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

// Maps every thrown error to { error: { message } } with the right status code,
// and never leaks stack traces / Prisma internals for anything unexpected.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = this.extractMessage(body, exception.message);
      res.status(status).json({ error: { message } });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { message: "Internal server error" },
    });
  }

  private extractMessage(body: unknown, fallback: string): string {
    if (typeof body === "string") return body;
    if (body && typeof body === "object" && "message" in body) {
      const message = (body as { message: unknown }).message;
      if (Array.isArray(message)) return message.join("; ");
      if (typeof message === "string") return message;
    }
    return fallback;
  }
}
