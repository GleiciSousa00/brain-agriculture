import { NavLink, Navigate, Route, Routes } from 'react-router';
import { Tela } from './componentes/Tela';
import { NaoEncontrada } from './paginas/NaoEncontrada';
import { CadastroPage } from './paginas/cadastro/CadastroPage';
import { CatalogosSecao } from './paginas/cadastro/CatalogosSecao';
import { PlantiosSecao } from './paginas/cadastro/PlantiosSecao';
import { ProdutoresSecao } from './paginas/cadastro/ProdutoresSecao';
import { PropriedadesSecao } from './paginas/cadastro/PropriedadesSecao';
import { PainelPage } from './paginas/painel/PainelPage';

export function App() {
  return (
    <div className="aplicacao">
      <header className="cabecalho">
        <span className="marca-do-produto">Cadastro Rural</span>
        <nav aria-label="Telas">
          <NavLink to="/painel">Painel</NavLink>
          <NavLink to="/cadastro">Cadastro</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route
            path="/painel"
            element={
              <Tela nome="Painel">
                <PainelPage />
              </Tela>
            }
          />
          <Route path="/cadastro" element={<CadastroPage />}>
            <Route index element={<Navigate to="produtores" replace />} />
            <Route
              path="produtores"
              element={
                <Tela nome="Produtores">
                  <ProdutoresSecao />
                </Tela>
              }
            />
            <Route
              path="propriedades"
              element={
                <Tela nome="Propriedades">
                  <PropriedadesSecao />
                </Tela>
              }
            />
            <Route
              path="plantios"
              element={
                <Tela nome="Plantios">
                  <PlantiosSecao />
                </Tela>
              }
            />
            <Route
              path="catalogos"
              element={
                <Tela nome="Culturas e Safras">
                  <CatalogosSecao />
                </Tela>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/painel" replace />} />
          <Route
            path="*"
            element={
              <Tela nome="Página não encontrada">
                <NaoEncontrada />
              </Tela>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
