import './zod-em-portugues';
import { criarPropriedadeSchema } from '../modules/propriedades/http/dto/criar-propriedade.dto';
import { criarProdutorSchema } from '../modules/produtores/http/dto/criar-produtor.dto';

/** Um corpo que passa, para que cada caso troque só o campo que quer ver recusado. */
const PROPRIEDADE_VALIDA = {
  produtorId: '3f6c2b1e-9a4d-4c17-8b2a-5e7f1d0c9a34',
  nome: 'Fazenda Boa Vista',
  cidade: 'Ribeirão Preto',
  estado: 'SP',
  areaTotal: 100,
  areaAgricultavel: 60,
  areaDeVegetacao: 40,
};

function recusaDe(schema: { safeParse: (corpo: unknown) => { error?: { issues: { message: string }[] } } }, corpo: unknown): string {
  const { error } = schema.safeParse(corpo);

  return error === undefined ? '' : error.issues.map(({ message }) => message).join('; ');
}

describe('recusa de esquema em português', () => {
  it('nomeia o campo que falta em vez de repetir o texto da biblioteca', () => {
    expect(recusaDe(criarProdutorSchema, { documento: '39053344705', nome: '  ' })).toBe(
      'Informe o nome do Produtor.',
    );
  });

  it('diz o tamanho esperado do Documento', () => {
    expect(recusaDe(criarProdutorSchema, { documento: '390', nome: 'Ana' })).toBe(
      'Informe o Documento: onze caracteres no CPF, catorze no CNPJ.',
    );
  });

  it('recusa área negativa dizendo por quê', () => {
    expect(recusaDe(criarPropriedadeSchema, { ...PROPRIEDADE_VALIDA, areaTotal: -1 })).toBe(
      'A área não pode ser negativa.',
    );
  });

  it('recusa área que não é número sem citar o tipo em inglês', () => {
    expect(recusaDe(criarPropriedadeSchema, { ...PROPRIEDADE_VALIDA, areaTotal: '100' })).toBe(
      'A área é um número em hectares, com o ponto separando os decimais.',
    );
  });

  it('traduz também a recusa que nenhum campo personaliza', () => {
    const recusa = recusaDe(criarPropriedadeSchema, { ...PROPRIEDADE_VALIDA, cidade: 42 });

    expect(recusa).not.toMatch(/expected|received|Invalid input/);
    expect(recusa).toBe('Entrada inválida: esperava um texto, recebeu um número');
  });
});
