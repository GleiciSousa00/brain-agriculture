import { Documento } from './documento';
import { DocumentoInvalido } from './documento.errors';

/**
 * Os vetores vêm do código de referência da Receita Federal, não de biblioteca de npm.
 * Ver `docs/adr/0008-validacao-de-documento-segue-a-norma-da-receita.md`.
 */
const CNPJ_VALIDOS = [
  ['exemplo do Anexo XV', '12.ABC.345/01DE-35'],
  ['primeiro alfanumérico emitido', '00.000.000/E08G-12'],
  ['só letras nas doze primeiras posições', 'AB.CDE.FGH/IJKL-80'],
  ['resto menor que dois no cálculo', '12.345.678/000A-08'],
  ['numérico antigo, que continua valendo', '00.000.000/0001-91'],
  ['caracteres repetidos, que a Receita aceita', '11.111.111/1111-80'],
] as const;

const CNPJ_INVALIDOS = [
  ['dígito verificador errado', 'AB.CDE.FGH/IJKL-81'],
  ['zerado, recusado por regra à parte', '00.000.000/0000-00'],
  ['letra minúscula', '12.ABc.345/01DE-35'],
  ['letra em posição de dígito verificador', '00.000.000/0001-9L'],
] as const;

describe('Documento', () => {
  describe('CNPJ', () => {
    it.each(CNPJ_VALIDOS)('aceita %s: %s', (_caso, entrada) => {
      expect(Documento.criar(entrada).tipo).toBe('CNPJ');
    });

    it.each(CNPJ_INVALIDOS)('recusa %s: %s', (_caso, entrada) => {
      expect(() => Documento.criar(entrada)).toThrow(DocumentoInvalido);
    });

    it('aceita caractere repetido, ao contrário do CPF', () => {
      // Não é engano nem defeito: `11.111.111/1111-80` fecha pelo módulo 11 e a Receita
      // o considera válido. Só o zerado é excluído, e por regra escrita à parte. Ver
      // `docs/adr/0008-validacao-de-documento-segue-a-norma-da-receita.md`.
      expect(() => Documento.criar('11.111.111/1111-80')).not.toThrow();
      expect(() => Documento.criar('111.111.111-11')).toThrow(DocumentoInvalido);
    });

    it('aceita o mesmo CNPJ com e sem máscara', () => {
      expect(Documento.criar('12.ABC.345/01DE-35').valor).toBe(
        Documento.criar('12ABC34501DE35').valor,
      );
    });
  });

  describe('CPF', () => {
    it.each([
      ['529.982.247-25'],
      ['52998224725'],
      ['111.444.777-35'],
    ])('aceita %s', (entrada) => {
      expect(Documento.criar(entrada).tipo).toBe('CPF');
    });

    it.each([
      ['dígito verificador errado', '529.982.247-26'],
      ['sequência repetida', '111.111.111-11'],
      ['letra onde só cabe dígito', '5299822472A'],
    ])('recusa %s: %s', (_caso, entrada) => {
      expect(() => Documento.criar(entrada)).toThrow(DocumentoInvalido);
    });
  });

  describe('forma', () => {
    it.each([['vazio', ''], ['curto demais', '1234567890'], ['comprimento entre os dois', '123456789012']])(
      'recusa %s: "%s"',
      (_caso, entrada) => {
        expect(() => Documento.criar(entrada)).toThrow(DocumentoInvalido);
      },
    );

    it('guarda o valor sem máscara', () => {
      expect(Documento.criar('529.982.247-25').valor).toBe('52998224725');
    });

    it('diz o que está errado na mensagem da recusa', () => {
      expect(() => Documento.criar('529.982.247-26')).toThrow(/dígito verificador/i);
      expect(() => Documento.criar('123')).toThrow(/onze|catorze/i);
    });
  });

  describe('máscara de exibição', () => {
    it('esconde tudo menos os dois últimos grupos do CPF', () => {
      expect(Documento.criar('52998224725').mascarado()).toBe('***.***.247-25');
    });

    it('esconde tudo menos os dois últimos grupos do CNPJ', () => {
      expect(Documento.criar('12ABC34501DE35').mascarado()).toBe('**.***.***/01DE-35');
    });
  });

  describe('igualdade', () => {
    it('dois Documentos com o mesmo valor são iguais', () => {
      expect(Documento.criar('529.982.247-25').igualA(Documento.criar('52998224725'))).toBe(true);
    });

    it('Documentos diferentes não são iguais', () => {
      expect(Documento.criar('529.982.247-25').igualA(Documento.criar('111.444.777-35'))).toBe(
        false,
      );
    });
  });
});
