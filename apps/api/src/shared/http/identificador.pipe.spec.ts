import type { ArgumentMetadata } from '@nestjs/common';
import { IdentificadorPipe } from './identificador.pipe';

const METADADOS: ArgumentMetadata = { type: 'param', data: 'id' };
const UM = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('o identificador que vem no caminho da rota', () => {
  it('deixa passar o que é identificador', async () => {
    await expect(new IdentificadorPipe().transform(UM, METADADOS)).resolves.toBe(UM);
  });

  it('recusa em português o que não é, sem repassar o texto da biblioteca', async () => {
    await expect(new IdentificadorPipe().transform('boa-vista', METADADOS)).rejects.toMatchObject({
      message: 'O identificador informado não é um UUID.',
    });
  });
});
