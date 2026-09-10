import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

const PORTA_PADRAO = 3000;

async function bootstrap(): Promise<void> {
  // `bufferLogs` segura as linhas do arranque até o logger de JSON estar de pé.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const porta = Number(process.env.API_PORT ?? PORTA_PADRAO);
  await app.listen(porta, '0.0.0.0');
}

void bootstrap();
