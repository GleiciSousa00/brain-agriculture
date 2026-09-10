import { NavLink, Navigate, Route, Routes } from 'react-router';
import { CadastroPage } from './paginas/cadastro/CadastroPage';
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
          <Route path="/cadastro" element={<CadastroPage />} />
          {/* A raiz e qualquer endereço desconhecido caem no painel, que é a tela de entrada. */}
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </main>
    </div>
  );
}
