import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { BuscarProdutorUseCase } from './application/buscar-produtor.use-case';
import { CriarProdutorUseCase } from './application/criar-produtor.use-case';
import { PRODUTOR_REPOSITORY, type ProdutorRepository } from './domain/produtor.repository';
import { DocumentoCrypto } from './infrastructure/crypto/documento-crypto';
import { ProdutorMapper } from './infrastructure/produtor.mapper';
import { ProdutorOrmEntity } from './infrastructure/produtor.orm-entity';
import { TypeormProdutorRepository } from './infrastructure/typeorm-produtor.repository';
import { ProdutoresController } from './http/produtores.controller';

/**
 * O único arquivo autorizado a enxergar as quatro camadas.
 *
 * Cada caso de uso é registrado à mão, com fábrica, porque `application` não importa
 * `@nestjs/*` e portanto não tem decorador de injeção. É o preço, pequeno, de a camada
 * continuar testável sem Nest. Ver o registro 0005.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ProdutorOrmEntity])],
  controllers: [ProdutoresController],
  providers: [
    {
      provide: DocumentoCrypto,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new DocumentoCrypto(
          materialSecreto(config, 'DOCUMENTO_ENCRYPTION_KEY'),
          materialSecreto(config, 'DOCUMENTO_FINGERPRINT_SECRET'),
        ),
    },
    {
      provide: ProdutorMapper,
      inject: [DocumentoCrypto],
      useFactory: (crypto: DocumentoCrypto) => new ProdutorMapper(crypto),
    },
    {
      provide: PRODUTOR_REPOSITORY,
      inject: [getRepositoryToken(ProdutorOrmEntity), ProdutorMapper, DocumentoCrypto],
      useFactory: (
        linhas: Repository<ProdutorOrmEntity>,
        mapper: ProdutorMapper,
        crypto: DocumentoCrypto,
      ) => new TypeormProdutorRepository(linhas, mapper, crypto),
    },
    {
      provide: CriarProdutorUseCase,
      inject: [PRODUTOR_REPOSITORY],
      useFactory: (produtores: ProdutorRepository) => new CriarProdutorUseCase(produtores),
    },
    {
      provide: BuscarProdutorUseCase,
      inject: [PRODUTOR_REPOSITORY],
      useFactory: (produtores: ProdutorRepository) => new BuscarProdutorUseCase(produtores),
    },
  ],
})
export class ProdutoresModule {}

/** A chave e o segredo chegam em base64 e não têm valor padrão: perder um é perder dado. */
function materialSecreto(config: ConfigService, variavel: string): Buffer {
  const valor = config.get<string>(variavel);

  if (valor === undefined || valor.length === 0) {
    throw new Error(`A variável de ambiente ${variavel} não está definida.`);
  }

  return Buffer.from(valor, 'base64');
}
