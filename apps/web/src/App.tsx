import { NavLink, Navigate, Route, Routes } from 'react-router';
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
          <Route path="/painel" element={<PainelPage />} />
          <Route path="/cadastro" element={<CadastroPage />}>
            <Route index element={<Navigate to="produtores" replace />} />
            <Route path="produtores" element={<ProdutoresSecao />} />
            <Route path="propriedades" element={<PropriedadesSecao />} />
            <Route path="plantios" element={<PlantiosSecao />} />
            <Route path="catalogos" element={<CatalogosSecao />} />
          </Route>
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </main>
    </div>
  );
}
