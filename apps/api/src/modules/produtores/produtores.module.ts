import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { BuscarProdutorUseCase } from './application/buscar-produtor.use-case';
import { CriarProdutorUseCase } from './application/criar-produtor.use-case';
import { EditarProdutorUseCase } from './application/editar-produtor.use-case';
import { ExcluirProdutorUseCase } from './application/excluir-produtor.use-case';
import { ListarProdutoresUseCase } from './application/listar-produtores.use-case';
import { PRODUTOR_REPOSITORY, type ProdutorRepository } from './domain/produtor.repository';
import {
  PROPRIEDADES_DO_PRODUTOR_REPOSITORY,
  type PropriedadesDoProdutorRepository,
} from './domain/propriedades-do-produtor.repository';
import { PropriedadesModule } from '../propriedades/propriedades.module';
import { DocumentoCrypto } from './infrastructure/crypto/documento-crypto';
import { readSecretMaterial } from './infrastructure/crypto/secret-material';
import { ProdutorMapper } from './infrastructure/produtor.mapper';
import { ProdutorOrmEntity } from './infrastructure/produtor.orm-entity';
import { TypeormProdutorRepository } from './infrastructure/typeorm-produtor.repository';
import { ProdutoresController } from './http/produtores.controller';
import { CriaProdutores1789040000000 } from './infrastructure/migrations/1789040000000-cria-produtores';
import { IndexaNomeDeProdutor1789065000000 } from './infrastructure/migrations/1789065000000-indexa-nome-de-produtor';

/**
 * O único arquivo autorizado a enxergar as quatro camadas.
 *
 * Cada caso de uso é registrado à mão, com fábrica, porque `application` não importa
 * `@nestjs/*` e portanto não tem decorador de injeção. É o preço, pequeno, de a camada
 * continuar testável sem Nest. Ver o registro 0005.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ProdutorOrmEntity]), PropriedadesModule],
  controllers: [ProdutoresController],
  providers: [
    {
      provide: DocumentoCrypto,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new DocumentoCrypto({
          chaveDeCifra: segredo(config, 'DOCUMENTO_ENCRYPTION_KEY'),
          segredoDaImpressao: segredo(config, 'DOCUMENTO_FINGERPRINT_SECRET'),
        }),
    },
    {
      provide: ProdutorMapper,
      inject: [DocumentoCrypto],
      useFactory: (crypto: DocumentoCrypto) => new ProdutorMapper(crypto),
    },
    {
      provide: PRODUTOR_REPOSITORY,
      inject: [getRepositoryToken(ProdutorOrmEntity), ProdutorMapper],
      useFactory: (linhas: Repository<ProdutorOrmEntity>, mapper: ProdutorMapper) =>
        new TypeormProdutorRepository(linhas, mapper),
    },
    {
      provide: CriarProdutorUseCase,
      inject: [PRODUTOR_REPOSITORY],
      useFactory: (produtores: ProdutorRepository) => new CriarProdutorUseCase(produtores),
    },
    {
      provide: BuscarProdutorUseCase,
      inject: [PRODUTOR_REPOSITORY, PROPRIEDADES_DO_PRODUTOR_REPOSITORY],
      useFactory: (
        produtores: ProdutorRepository,
        propriedades: PropriedadesDoProdutorRepository,
      ) => new BuscarProdutorUseCase(produtores, propriedades),
    },
    {
      provide: ListarProdutoresUseCase,
      inject: [PRODUTOR_REPOSITORY],
      useFactory: (produtores: ProdutorRepository) => new ListarProdutoresUseCase(produtores),
    },
    {
      provide: EditarProdutorUseCase,
      inject: [PRODUTOR_REPOSITORY],
      useFactory: (produtores: ProdutorRepository) => new EditarProdutorUseCase(produtores),
    },
    {
      provide: ExcluirProdutorUseCase,
      inject: [PRODUTOR_REPOSITORY],
      useFactory: (produtores: ProdutorRepository) => new ExcluirProdutorUseCase(produtores),
    },
  ],
})
export class ProdutoresModule {}

/** O que o módulo publica para a raiz de composição montar o catálogo do ORM. */
export const PRODUTORES_ENTIDADES = [ProdutorOrmEntity];

export const PRODUTORES_MIGRACOES = [CriaProdutores1789040000000, IndexaNomeDeProdutor1789065000000];

/** A chave e o segredo chegam em base64 e não têm valor padrão: perder um é perder dado. */
function segredo(config: ConfigService, variavel: string): Buffer {
  return readSecretMaterial(config.get<string>(variavel), variavel, config.get<string>('NODE_ENV'));
}
