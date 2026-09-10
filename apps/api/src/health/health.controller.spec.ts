import { DATABASE_CHECK, HealthController } from './health.controller';
import type { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  it('verifica o banco com um ping, sem tocar em tabela do cadastro', async () => {
    const pingCheck = jest.fn().mockResolvedValue({ [DATABASE_CHECK]: { status: 'up' } });
    const check = jest.fn(async (indicators: (() => Promise<unknown>)[]) => {
      await Promise.all(indicators.map((indicator) => indicator()));
      return { status: 'ok' };
    });

    const controller = new HealthController(
      { check } as unknown as HealthCheckService,
      { pingCheck } as unknown as TypeOrmHealthIndicator,
    );

    await expect(controller.check()).resolves.toMatchObject({ status: 'ok' });
    expect(pingCheck).toHaveBeenCalledWith(DATABASE_CHECK);
  });
});
