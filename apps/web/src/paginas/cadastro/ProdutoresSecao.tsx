import type { Produtor } from '@cadastro-rural/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { listarProdutores } from '../../api/produtores';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Campo } from '../../componentes/Campo';
import { formatarContagem } from '../../formato';
import { useCadastro } from './CadastroContexto';
import { propriedadesDe } from './hierarquia';
import { Listagem } from './Listagem';
import { useTentativa } from './useTentativa';

const CARREGANDO = 'Carregando os Produtores…';
const VAZIO = 'Nenhum Produtor cadastrado ainda.';
const PRIMEIRA_PROPRIEDADE = 'Registrar a primeira';

export function ProdutoresSecao() {
  const { criarProdutor, editarProdutor, excluirProdutor, quantasPropriedadesDe, cortado } =
    useCadastro();

  // Fechado, o formulário não ocupa a tela de quem só veio consultar. Aberto, ele é o de
  // registro ou o de edição, e é o Produtor em edição que diz qual dos dois.
  const [aberto, setAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Produtor>();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const tentativaDoFormulario = useTentativa();
  const tentativaDaExclusao = useTentativa();

  function fechar(): void {
    setAberto(false);
    setEmEdicao(undefined);
    setNome('');
    setDocumento('');
    // A recusa some com o formulário que a recebeu. Deixá-la sobre um formulário vazio
    // seria acusar de recusado o que ninguém mandou.
    tentativaDoFormulario.limpar();
  }

  function abrirParaRegistrar(): void {
    fechar();
    setAberto(true);
  }

  function abrirParaEditar(produtor: Produtor): void {
    setAberto(true);
    setEmEdicao(produtor);
    setNome(produtor.nome);
    setDocumento('');
    tentativaDoFormulario.limpar();
  }

  /** Nenhum campo é conferido aqui: quem recusa é a API, e o texto dela é o que aparece. */
  async function enviar(): Promise<void> {
    const passou = await tentativaDoFormulario.tentar(async () => {
      if (emEdicao === undefined) {
        await criarProdutor({ nome, documento });
      } else {
        await editarProdutor(emEdicao.id, { nome });
      }
    });

    if (passou) {
      fechar();
    }
  }

  async function excluir(id: string): Promise<void> {
    await tentativaDaExclusao.tentar(() => excluirProdutor(id));
  }

  return (
    <div className="secao">
      {aberto && (
        <form
          className="cartao formulario"
          // A conferência do navegador fica de fora de propósito: ela barraria o envio com
          // um texto que não é o da API, e o critério é que a recusa venha do corpo dela.
          noValidate
          onSubmit={(evento) => {
            evento.preventDefault();
            void enviar();
          }}
        >
          <h3>{emEdicao === undefined ? 'Novo Produtor' : `Editar ${emEdicao.nome}`}</h3>
          <Campo rotulo="Nome" valor={nome} aoMudar={setNome} />
          {emEdicao === undefined ? (
            <Campo
              rotulo="Documento"
              valor={documento}
              aoMudar={setDocumento}
              ajuda="CPF ou CNPJ, com ou sem máscara."
            />
          ) : (
            // O Documento não é editável, e mostrá-lo desabilitado só convidaria a tentar.
            <p className="campo">
              <span className="rotulo-fixo">Documento</span>
              <span className="valor-fixo">{emEdicao.documento}</span>
              <span className="ajuda">O Documento de um Produtor não muda.</span>
            </p>
          )}
          {tentativaDoFormulario.recusa !== undefined && (
            <p className="largura-inteira" role="alert">
              {tentativaDoFormulario.recusa}
            </p>
          )}
          <p className="acoes largura-inteira">
            <button type="submit">{emEdicao === undefined ? 'Registrar' : 'Salvar'}</button>
            <button type="button" onClick={fechar}>
              Cancelar
            </button>
          </p>
        </form>
      )}

      {/* A recusa de uma exclusão fica junto da lista, que é onde ela foi pedida. */}
      {tentativaDaExclusao.recusa !== undefined && (
        <p role="alert">{tentativaDaExclusao.recusa}</p>
      )}

      <Listagem
        titulo="Produtores"
        acoes={
          !aberto && (
            <button type="button" className="abridor" onClick={abrirParaRegistrar}>
              Novo Produtor
            </button>
          )
        }
        listar={listarProdutores}
        carregando={CARREGANDO}
        vazio={VAZIO}
      >
        {(produtores) => (
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Documento</th>
                <th scope="col">Propriedades</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtores.map((produtor) => (
                <tr key={produtor.id} className={emEdicao?.id === produtor.id ? 'em-edicao' : ''}>
                  <td>{produtor.nome}</td>
                  {/* Mascarado é como a API o entrega. A tela não o formata de novo. */}
                  <td className="documento">{produtor.documento}</td>
                  <td>
                    <PropriedadesDo
                      produtor={produtor}
                      quantas={cortado ? undefined : quantasPropriedadesDe(produtor.id)}
                    />
                  </td>
                  <td className="acoes">
                    <button
                      type="button"
                      className="miudo"
                      onClick={() => {
                        abrirParaEditar(produtor);
                      }}
                    >
                      Editar {produtor.nome}
                    </button>
                    <BotaoDeExclusao
                      rotulo={`Excluir ${produtor.nome}`}
                      pergunta={`Excluir ${produtor.nome}? As Propriedades e os Plantios desse Produtor vão junto.`}
                      aoConfirmar={() => {
                        void excluir(produtor.id);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Listagem>
    </div>
  );
}

interface PropsDaColuna {
  produtor: Produtor;
  /** Quantas Propriedades ele tem, ou nada quando o catálogo não permite afirmá-lo. */
  quantas?: number;
}

/**
 * A descida do Produtor para as Propriedades dele.
 *
 * O número já responde quanto existe, e o link leva ao recorte. Sem Propriedade nenhuma,
 * o que se oferece é registrar a primeira, e o formulário abre do outro lado já em nome
 * dele: um link para uma lista vazia não é resposta a quem está começando o cadastro.
 *
 * A conta sai do catálogo, que para no centésimo. Passando dele, um zero pode ser só o
 * que não veio, e oferecer "registrar a primeira" a quem já tem Propriedade seria uma
 * mentira com botão: aí a coluna desce sem contar.
 */
function PropriedadesDo({ produtor, quantas }: PropsDaColuna) {
  if (quantas === undefined) {
    return (
      <Link
        className="ligacao"
        to={propriedadesDe(produtor.id)}
        aria-label={`Ver as Propriedades de ${produtor.nome}`}
      >
        Ver Propriedades ›
      </Link>
    );
  }

  const semNenhuma = quantas === 0;

  return (
    <Link
      className="ligacao"
      to={propriedadesDe(produtor.id, semNenhuma)}
      aria-label={
        semNenhuma
          ? `Registrar a primeira Propriedade de ${produtor.nome}`
          : `Ver as Propriedades de ${produtor.nome}`
      }
    >
      {semNenhuma ? PRIMEIRA_PROPRIEDADE : formatarContagem(quantas, 'propriedade', 'propriedades')}{' '}
      ›
    </Link>
  );
}
