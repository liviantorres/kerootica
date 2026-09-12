import { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Troque Link por NavLink
import oculosIcon from '../assets/icons/oculos.svg';

import casaBranca from '../assets/icons/casa_branca.svg';
import casaAzul from '../assets/icons/casa_azul.svg';
import clienteBranca from '../assets/icons/cliente_branco.svg';
import clienteAzul from '../assets/icons/cliente_azul.svg';
import caixaBranca from '../assets/icons/caixa_branca.svg';
import caixaAzul from '../assets/icons/caixa_azul.svg';
import relatorioBranco from '../assets/icons/relatorio_branco.svg';
import relatorioAzul from '../assets/icons/relatorio_azul.svg';

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
                
                <NavLink to="/home" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    {({ isActive }) => (
                        <>
                            <img 
                                src={isActive ? casaBranca : casaAzul} 
                                alt="Início" 
                                className="nav-icon" 
                            />
                            {isOpen && <span className="nav-text">Página Inicial</span>}
                        </>
                    )}
                </NavLink>

                <NavLink to="/clientes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    {({ isActive }) => (
                        <>
                            <img 
                                src={isActive ? clienteBranca : clienteAzul} 
                                alt="Clientes" 
                                className="nav-icon" 
                            />
                            {isOpen && <span className="nav-text">Clientes</span>}
                        </>
                    )}
                </NavLink>

                <NavLink to="/caixa" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    {({ isActive }) => (
                        <>
                            <img 
                                src={isActive ? caixaBranca : caixaAzul} 
                                alt="Caixa" 
                                className="nav-icon" 
                            />
                            {isOpen && <span className="nav-text">Caixa</span>}
                        </>
                    )}
                </NavLink>

                <NavLink to="/relatorios" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    {({ isActive }) => (
                        <>
                            <img 
                                src={isActive ? relatorioBranco : relatorioAzul} 
                                alt="Relatórios" 
                                className="nav-icon" 
                            />
                            {isOpen && <span className="nav-text">Relatórios</span>}
                        </>
                    )}
                </NavLink>

                
            </nav>
        </aside>
    );
}