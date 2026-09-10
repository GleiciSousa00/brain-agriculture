import type { Produtor } from '@cadastro-rural/contracts';
import { useId, useState } from 'react';
import { listarProdutores } from '../../api/produtores';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Campo } from '../../componentes/Campo';
import { useCadastro } from './CadastroContexto';
import { Listagem } from './Listagem';
import { useTentativa } from './useTentativa';

const CARREGANDO = 'Carregando os Produtores…';
const VAZIO = 'Nenhum Produtor cadastrado ainda.';

export function ProdutoresSecao() {
  const { criarProdutor, editarProdutor, excluirProdutor } = useCadastro();

  const [emEdicao, setEmEdicao] = useState<Produtor>();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const tentativaDoFormulario = useTentativa();
  const tentativaDaExclusao = useTentativa();
  const tituloId = useId();

  function limpar(): void {
    setEmEdicao(undefined);
    setNome('');
    setDocumento('');
    // A recusa some com o formulário que a recebeu. Deixá-la sobre um formulário vazio
    // seria acusar de recusado o que ninguém mandou.
    tentativaDoFormulario.limpar();
  }

  function comecarAEditar(produtor: Produtor): void {
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
      limpar();
    }
  }

  async function excluir(id: string): Promise<void> {
    await tentativaDaExclusao.tentar(() => excluirProdutor(id));
  }

  return (
    <section className="secao" aria-labelledby={tituloId}>
      <h2 id={tituloId}>Produtores</h2>

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
            ajuda="Com ou sem máscara."
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
        {tentativaDoFormulario.recusa !== undefined && (
          <p role="alert">{tentativaDoFormulario.recusa}</p>
        )}
      </form>

      {/* A recusa de uma exclusão fica junto da tabela, que é onde ela foi pedida. */}
      {tentativaDaExclusao.recusa !== undefined && (
        <p role="alert">{tentativaDaExclusao.recusa}</p>
      )}

      <Listagem listar={listarProdutores} carregando={CARREGANDO} vazio={VAZIO}>
        {(produtores) => (
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Documento</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtores.map((produtor) => (
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
        )}
      </Listagem>
    </section>
  );
}
