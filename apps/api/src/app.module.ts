import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, DiscoveryModule } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
// A recusa de esquema fala português a partir daqui. O módulo é só efeito, e vem antes
// de qualquer DTO porque a configuração do Zod é global.
import './config/zod-em-portugues';
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
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    LoggingModule,
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
    { provide: APP_GUARD, useClass: TipoDeConteudoGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
