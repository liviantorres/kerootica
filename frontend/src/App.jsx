import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Clientes from './pages/Clientes';
import Caixa from './pages/Caixa';
import Relatorios from './pages/Relatorios';
import ProtectedRoute from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Adicione o MainLayout envolvendo a Home */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;