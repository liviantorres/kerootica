import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Clientes from './pages/Clientes';
import Vendas from './pages/Vendas';
import Caixa from './pages/Caixa';
import Relatorios from './pages/Relatorios';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { MainLayout } from './components/MainLayout';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas: se já autenticado, redireciona para /home */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Rotas protegidas: só acessíveis com token JWT válido */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/caixa" element={<Caixa />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </Route>
          </Route>

          {/* Qualquer outra rota vai para /home (que por sua vez redireciona para /login se não autenticado) */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
