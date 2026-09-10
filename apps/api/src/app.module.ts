import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, DiscoveryModule } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { databaseOptions } from './config/database.config';
import { CulturasModule } from './modules/culturas/culturas.module';
import { HealthModule } from './health/health.module';
import { PainelModule } from './modules/painel/painel.module';
import { PlantiosModule } from './modules/plantios/plantios.module';
import { ProdutoresModule } from './modules/produtores/produtores.module';
import { PropriedadesModule } from './modules/propriedades/propriedades.module';
import { SafrasModule } from './modules/safras/safras.module';
import { ProblemDetailsFilter } from './shared/http/problem-details.filter';
import { RotasDaApi } from './shared/http/rotas-da-api';
import { TipoDeConteudoGuard } from './shared/http/tipo-de-conteudo.guard';
import { LoggingModule } from './shared/logging/logging.module';

@Module({
  imports: [
    // O `.env` é procurado ao lado desta aplicação e, depois, na raiz do repositório. Os
    // comandos rodam com a pasta corrente em `apps/api`, então sem o segundo caminho um
    // `.env` na raiz, que é onde o `.env.example` está, seria ignorado em silêncio.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    LoggingModule,
    // A tabela de rotas do filtro é montada a partir dos controladores descobertos aqui.
    DiscoveryModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseOptions,
    }),
    HealthModule,
    ProdutoresModule,
    PropriedadesModule,
    SafrasModule,
    CulturasModule,
    PlantiosModule,
    PainelModule,
  ],
  providers: [
    RotasDaApi,
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    // Corpo que não é JSON é recusado antes de chegar ao esquema, com 415.
    { provide: APP_GUARD, useClass: TipoDeConteudoGuard },
    // A entrada é conferida pelo esquema Zod do DTO, e a saída é montada pelo esquema de
    // resposta. Nada sai por padrão. Ver o registro 0007.
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
