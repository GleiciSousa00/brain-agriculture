import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { OPENAPI_PATH, buildOpenApiDocument } from './config/openapi';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  // `bufferLogs` segura as linhas do arranque até o logger de JSON estar de pé.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  // O `X-Powered-By` do Express não serve a quem integra e diz a quem procura alvo com
  // que servidor está falando.
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();

  SwaggerModule.setup(OPENAPI_PATH, app, buildOpenApiDocument(app));

  const port = Number(process.env.API_PORT ?? DEFAULT_PORT);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
