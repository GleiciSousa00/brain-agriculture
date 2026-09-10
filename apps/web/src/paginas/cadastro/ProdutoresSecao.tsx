import type { Produtor } from '@cadastro-rural/contracts';
import { useCallback, useId, useState } from 'react';
import { mensagemDe } from '../../api/chamada';
import { TAMANHO_DA_PAGINA } from '../../api/pagina';
import { listarProdutores } from '../../api/produtores';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Campo } from '../../componentes/Campo';
import { Paginacao } from '../../componentes/Paginacao';
import { useCadastro } from './CadastroContexto';
import { useFatia } from './useFatia';

const VAZIO = 'Nenhum Produtor cadastrado ainda.';

export function ProdutoresSecao() {
  const { criarProdutor, editarProdutor, excluirProdutor, versao } = useCadastro();
  const buscar = useCallback((pagina: number) => listarProdutores(pagina, TAMANHO_DA_PAGINA), []);
  const fatia = useFatia(buscar, versao);

  const [emEdicao, setEmEdicao] = useState<Produtor>();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [recusaDoFormulario, setRecusaDoFormulario] = useState<string>();
  const [recusaDaExclusao, setRecusaDaExclusao] = useState<string>();
  const tituloId = useId();

  function limpar(): void {
    setEmEdicao(undefined);
    setNome('');
    setDocumento('');
  }

  function comecarAEditar(produtor: Produtor): void {
    setEmEdicao(produtor);
    setNome(produtor.nome);
    setDocumento('');
    setRecusaDoFormulario(undefined);
  }

  /** Nenhum campo é conferido aqui: quem recusa é a API, e o texto dela é o que aparece. */
  async function enviar(): Promise<void> {
    setRecusaDoFormulario(undefined);

    try {
      if (emEdicao === undefined) {
        await criarProdutor({ nome, documento });
      } else {
        await editarProdutor(emEdicao.id, { nome });
      }

      limpar();
    } catch (causa: unknown) {
      setRecusaDoFormulario(mensagemDe(causa));
    }
  }

  async function excluir(id: string): Promise<void> {
    setRecusaDaExclusao(undefined);

    try {
      await excluirProdutor(id);
    } catch (causa: unknown) {
      setRecusaDaExclusao(mensagemDe(causa));
    }
  }

  return (
    <section className="secao" aria-labelledby={tituloId}>
      <h2 id={tituloId}>Produtores</h2>

      <form
        className="cartao formulario"
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
            <span>{emEdicao.documento}</span>
            <span className="ajuda">O Documento de um Produtor não muda.</span>
          </p>
        )}
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

      {/* A recusa de uma exclusão fica junto da tabela, que é onde ela foi pedida. */}
      {recusaDaExclusao !== undefined && <p role="alert">{recusaDaExclusao}</p>}

      {fatia.erro !== undefined && <p role="alert">{fatia.erro}</p>}
      {fatia.carregando && <p role="status">Carregando os Produtores…</p>}

      {!fatia.carregando &&
        (fatia.itens.length === 0 ? (
          <p className="vazio">{VAZIO}</p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Documento</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {fatia.itens.map((produtor) => (
                <tr key={produtor.id}>
                  <td>{produtor.nome}</td>
                  {/* Mascarado é como a API o entrega. A tela não o formata de novo. */}
                  <td>{produtor.documento}</td>
                  <td className="acoes">
                    <button
                      type="button"
                      onClick={() => {
                        comecarAEditar(produtor);
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
        ))}

      <Paginacao pagina={fatia.pagina} paginas={fatia.paginas} irPara={fatia.irPara} />
    </section>
  );
}
