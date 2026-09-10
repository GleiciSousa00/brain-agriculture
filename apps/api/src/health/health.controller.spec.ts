import { HealthController, VERIFICACAO_DE_BANCO } from './health.controller';
import type { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  it('verifica o banco com um ping, sem tocar em tabela do cadastro', async () => {
    const pingCheck = jest.fn().mockResolvedValue({ [VERIFICACAO_DE_BANCO]: { status: 'up' } });
    const check = jest.fn(async (verificadores: (() => Promise<unknown>)[]) => {
      await Promise.all(verificadores.map((verificador) => verificador()));
      return { status: 'ok' };
    });

    const controller = new HealthController(
      { check } as unknown as HealthCheckService,
      { pingCheck } as unknown as TypeOrmHealthIndicator,
    );

    await expect(controller.verificar()).resolves.toMatchObject({ status: 'ok' });
    expect(pingCheck).toHaveBeenCalledWith(VERIFICACAO_DE_BANCO);
  });
});
