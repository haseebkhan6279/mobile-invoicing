import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/create-app";

let cached: express.Express | null = null;

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  configureApp(app);
  await app.init();
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cached ??= await bootstrap();
  cached(req, res);
}
