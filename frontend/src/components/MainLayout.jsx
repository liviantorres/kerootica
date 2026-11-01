import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/layout.css';

export function MainLayout() {
    const location = useLocation();
    const { usuario } = useAuth();
    
    // Mapeia a URL atual para o título da tela
    const pageTitles = {
        '/home': 'Página Inicial',
        '/clientes': 'Gestão de Clientes',
        '/vendas': 'Gestão de Vendas',
        '/caixa': 'Gestão de Caixa',
        '/relatorios': 'Relatórios'
    };
    
    const currentTitle = pageTitles[location.pathname] || 'Página Inicial';

    const userName = usuario?.nome || "Usuário"; 
    const userRole = usuario?.perfil === "admin" ? "Administrador" : (usuario?.perfil || "Funcionário");

    return (
        <div className="app-container">
            <Header title={currentTitle} userName={userName} userRole={userRole} />
            
            <div className="app-body">
                {/* Posicione o menu lateral ao lado do conteúdo principal */}
                <Sidebar />
                
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
