import { Plantio } from './plantio';

const LIGACAO = {
  propriedadeId: '3f1b7e5c-0a4d-4c8e-9a11-6b2c8d5e7f01',
  culturaId: '7c2d9a1e-5b3f-4e6a-8d02-1f4b6c8e9a23',
  safraId: 'b5e8d3c1-2a6f-4907-9c4b-8e1d3f5a7c69',
};

describe('Plantio', () => {
  it('guarda a Cultura, a Propriedade e a Safra que liga', () => {
    const plantio = Plantio.criar(LIGACAO);

    expect(plantio).toMatchObject(LIGACAO);
  });

  it('dá identificador próprio a cada registro, mesmo com a ligação repetida', () => {
    const um = Plantio.criar(LIGACAO);
    const outro = Plantio.criar(LIGACAO);

    // Que a ligação repetida seja recusada é regra do cadastro, e não da entidade: quem
    // responde por ela é o caso de uso, apoiado na restrição de unicidade do banco.
    expect(um.id).not.toBe(outro.id);
  });

  it('mantém o identificador gravado ao voltar da persistência', () => {
    const gravado = { id: 'd0c4a2e6-9f18-4b3d-a75c-2e6b8d0f4a19', ...LIGACAO };

    expect(Plantio.restaurar(gravado)).toMatchObject(gravado);
  });
});
