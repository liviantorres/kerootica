import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import '../assets/styles/layout.css';

export function MainLayout() {
    const location = useLocation();
    
    // Mapeia a URL atual para o título da tela
    const pageTitles = {
        '/home': 'Página Inicial',
        '/clientes': 'Gestão de Clientes',
        '/produtos': 'Catálogo de Produtos'
    };
    
    const currentTitle = pageTitles[location.pathname] || 'Página Inicial';

    // No futuro, esses dados virão do seu hook useAuth ou Contexto
    const userName = "Keroótica"; 
    const userRole = "Administrador";

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