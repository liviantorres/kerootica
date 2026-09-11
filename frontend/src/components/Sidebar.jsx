import { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Troque Link por NavLink
import oculosIcon from '../assets/icons/oculos.svg';
import casaBranca from '../assets/icons/casa_branca.svg';
import '../assets/styles/sidebar.css'; 

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <aside className={isOpen ? "sidebar open" : "sidebar closed"}>
            <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                <img 
                    src={oculosIcon} 
                    alt="Menu" 
                    className={isOpen ? "oculos-em-pe" : "oculos-deitado"} 
                />
            </button>

            <nav className="sidebar-nav">
                {/* O NavLink recebe uma função para injetar a classe "active" quando clicado */}
                <NavLink to="/home" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <img src={casaBranca} alt="Início" className="nav-icon" />
                    {isOpen && <span className="nav-text">Página Inicial</span>}
                </NavLink>

                <NavLink to="/clientes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">👥</span>
                    {isOpen && <span className="nav-text">Clientes</span>}
                </NavLink>

                <NavLink to="/caixa" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">📦</span>
                    {isOpen && <span className="nav-text">Caixa</span>}
                </NavLink>

                <NavLink to="/relatorios" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <span className="nav-icon">📊</span>
                    {isOpen && <span className="nav-text">Relatórios</span>}
                </NavLink>
            </nav>
        </aside>
    );
}