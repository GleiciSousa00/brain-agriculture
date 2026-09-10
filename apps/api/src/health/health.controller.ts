import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';

/** Nome do único verificador da rota de saúde. */
export const DATABASE_CHECK = 'database';

/**
 * Rota de saúde. Ela responde se a aplicação está de pé e se o banco atende, e faz isso
 * sem tocar em nenhuma tabela do cadastro: o verificador do TypeORM só manda um `SELECT 1`.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.pingCheck(DATABASE_CHECK)]);
  }
}
