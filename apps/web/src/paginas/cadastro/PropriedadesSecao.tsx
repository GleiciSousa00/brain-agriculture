import type { Propriedade } from '@cadastro-rural/contracts';
import { useCallback, useId, useState } from 'react';
import { mensagemDe } from '../../api/chamada';
import { TAMANHO_DA_PAGINA } from '../../api/pagina';
import { listarPropriedades } from '../../api/propriedades';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Campo } from '../../componentes/Campo';
import { Escolha } from '../../componentes/Escolha';
import { comoNumero, formatarHectares } from '../../formato';
import { useCadastro } from './CadastroContexto';
import { Listagem } from './Listagem';
import { usePagina } from './usePagina';

const CARREGANDO = 'Carregando as Propriedades…';
const VAZIO = 'Nenhuma Propriedade cadastrada ainda.';
const SEM_PRODUTOR = 'Registre um Produtor antes: toda Propriedade é registrada em nome de um.';
const FORA_DO_CATALOGO = '—';

/** O que o formulário guarda enquanto se digita: texto, como o campo devolve. */
interface Rascunho {
  produtorId: string;
  nome: string;
  cidade: string;
  estado: string;
  areaTotal: string;
  areaAgricultavel: string;
  areaDeVegetacao: string;
}

const RASCUNHO_LIMPO: Rascunho = {
  produtorId: '',
  nome: '',
  cidade: '',
  estado: '',
  areaTotal: '',
  areaAgricultavel: '',
  areaDeVegetacao: '',
};

function rascunhoDe(propriedade: Propriedade): Rascunho {
  return {
    produtorId: propriedade.produtorId,
    nome: propriedade.nome,
    cidade: propriedade.cidade,
    estado: propriedade.estado,
    areaTotal: String(propriedade.areaTotal),
    areaAgricultavel: String(propriedade.areaAgricultavel),
    areaDeVegetacao: String(propriedade.areaDeVegetacao),
  };
}

/** O corpo que a API aceita na edição: tudo menos o Produtor, que não muda. */
function corpoDe(rascunho: Rascunho) {
  return {
    nome: rascunho.nome,
    cidade: rascunho.cidade,
    estado: rascunho.estado,
    areaTotal: comoNumero(rascunho.areaTotal),
    areaAgricultavel: comoNumero(rascunho.areaAgricultavel),
    areaDeVegetacao: comoNumero(rascunho.areaDeVegetacao),
  };
}

export function PropriedadesSecao() {
  const { produtores, criarPropriedade, editarPropriedade, excluirPropriedade, versao } =
    useCadastro();
  const buscar = useCallback((pagina: number) => listarPropriedades(pagina, TAMANHO_DA_PAGINA), []);
  const pagina = usePagina(buscar, versao);

  const [emEdicao, setEmEdicao] = useState<Propriedade>();
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_LIMPO);
  const [recusaDoFormulario, setRecusaDoFormulario] = useState<string>();
  const [recusaDaExclusao, setRecusaDaExclusao] = useState<string>();
  const tituloId = useId();

  const campo = (chave: keyof Rascunho) => (valor: string) => {
    setRascunho((anterior) => ({ ...anterior, [chave]: valor }));
  };

  function limpar(): void {
    setEmEdicao(undefined);
    setRascunho(RASCUNHO_LIMPO);
    setRecusaDoFormulario(undefined);
  }

  function comecarAEditar(propriedade: Propriedade): void {
    setEmEdicao(propriedade);
    setRascunho(rascunhoDe(propriedade));
    setRecusaDoFormulario(undefined);
  }

  /** A regra das áreas mora na API. Aqui só se mostra a recusa que ela mandou. */
  async function enviar(): Promise<void> {
    setRecusaDoFormulario(undefined);

    try {
      if (emEdicao === undefined) {
        await criarPropriedade({ produtorId: rascunho.produtorId, ...corpoDe(rascunho) });
      } else {
        await editarPropriedade(emEdicao.id, corpoDe(rascunho));
      }

      limpar();
    } catch (causa: unknown) {
      setRecusaDoFormulario(mensagemDe(causa));
    }
  }

  async function excluir(id: string): Promise<void> {
    setRecusaDaExclusao(undefined);

    try {
      await excluirPropriedade(id);
    } catch (causa: unknown) {
      setRecusaDaExclusao(mensagemDe(causa));
    }
  }

  /**
   * O nome do Produtor de uma Propriedade.
   *
   * Ele sai do catálogo em memória, que vai até cem. Passando disso, a Propriedade de um
   * Produtor que ficou de fora aparece sem nome, e o aviso do alto da tela é quem explica
   * por quê.
   */
  function nomeDoProdutor(produtorId: string): string {
    return produtores.find((produtor) => produtor.id === produtorId)?.nome ?? FORA_DO_CATALOGO;
  }

  // Sem Produtor no cadastro não há em nome de quem registrar, e um formulário que só
  // pode ser recusado é pior do que um formulário que não aparece.
  const podeRegistrar = emEdicao !== undefined || produtores.length > 0;

  return (
    <section className="secao" aria-labelledby={tituloId}>
      <h2 id={tituloId}>Propriedades</h2>

      {podeRegistrar ? (
        <form
          className="cartao formulario"
          // Sem a conferência do navegador: a recusa tem de vir do corpo da API, e um
          // valor fora do passo faria o navegador barrar o envio com texto dele.
          noValidate
          onSubmit={(evento) => {
            evento.preventDefault();
            void enviar();
          }}
        >
          <h3>{emEdicao === undefined ? 'Nova Propriedade' : `Editar ${emEdicao.nome}`}</h3>
          {emEdicao === undefined ? (
            <Escolha
              rotulo="Produtor"
              valor={rascunho.produtorId}
              aoMudar={campo('produtorId')}
              vazia="Escolha um Produtor"
              opcoes={produtores.map((produtor) => ({
                valor: produtor.id,
                rotulo: produtor.nome,
              }))}
            />
          ) : (
            // Mudar a Propriedade de Produtor não é uma operação que a API ofereça.
            <p className="campo">
              <span className="rotulo-fixo">Produtor</span>
              <span>{nomeDoProdutor(emEdicao.produtorId)}</span>
            </p>
          )}
          <Campo rotulo="Nome" valor={rascunho.nome} aoMudar={campo('nome')} />
          <Campo rotulo="Cidade" valor={rascunho.cidade} aoMudar={campo('cidade')} />
          <Campo
            rotulo="Estado"
            valor={rascunho.estado}
            aoMudar={campo('estado')}
            ajuda="A sigla da unidade federativa, como MG."
          />
          <Campo
            rotulo="Área total"
            tipo="number"
            passo="0.01"
            valor={rascunho.areaTotal}
            aoMudar={campo('areaTotal')}
            ajuda="Em hectares."
          />
          <Campo
            rotulo="Área agricultável"
            tipo="number"
            passo="0.01"
            valor={rascunho.areaAgricultavel}
            aoMudar={campo('areaAgricultavel')}
          />
          <Campo
            rotulo="Área de vegetação"
            tipo="number"
            passo="0.01"
            valor={rascunho.areaDeVegetacao}
            aoMudar={campo('areaDeVegetacao')}
          />
          <p className="acoes">
            <button type="submit">{emEdicao === undefined ? 'Registrar' : 'Salvar'}</button>
            {emEdicao !== undefined && (
              <button type="button" onClick={limpar}>
                Cancelar edição
              </button>
            )}
          </p>
          {recusaDoFormulario !== undefined && <p role="alert">{recusaDoFormulario}</p>}
        </form>
      ) : (
        <p className="cartao vazio">{SEM_PRODUTOR}</p>
      )}

      {/* A recusa de uma exclusão fica junto da tabela, que é onde ela foi pedida. */}
      {recusaDaExclusao !== undefined && <p role="alert">{recusaDaExclusao}</p>}

      <Listagem pagina={pagina} carregando={CARREGANDO} vazio={VAZIO}>
        {(propriedades) => (
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Produtor</th>
                <th scope="col">Onde</th>
                <th scope="col">Área total</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {propriedades.map((propriedade) => (
                <tr key={propriedade.id}>
                  <td>{propriedade.nome}</td>
                  <td>{nomeDoProdutor(propriedade.produtorId)}</td>
                  <td>
                    {propriedade.cidade}/{propriedade.estado}
                  </td>
                  <td>{formatarHectares(propriedade.areaTotal)}</td>
                  <td className="acoes">
                    <button
                      type="button"
                      onClick={() => {
                        comecarAEditar(propriedade);
                      }}
                    >
                      Editar {propriedade.nome}
                    </button>
                    <BotaoDeExclusao
                      rotulo={`Excluir ${propriedade.nome}`}
                      pergunta={`Excluir ${propriedade.nome}? Os Plantios dessa Propriedade vão junto.`}
                      aoConfirmar={() => {
                        void excluir(propriedade.id);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Listagem>
    </section>
  );
}
