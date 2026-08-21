import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TransformInterceptor } from "./common/transform.interceptor";
import { HttpExceptionFilter } from "./common/http-exception.filter";

const VERCEL_PREVIEW_ORIGIN = /^https:\/\/[\w.-]+\.vercel\.app$/;

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix("api/v1", { exclude: ["health"] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const allowed = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:8081,http://localhost:19006")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Same-origin / server-to-server / native mobile clients send no Origin header.
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      if (VERCEL_PREVIEW_ORIGIN.test(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  });

  return app;
}
