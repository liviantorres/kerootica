import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo-header.svg';
import '../assets/styles/Header.css'; 
import seta from '../assets/icons/seta_baixo.svg';
import { useAuth } from '../contexts/AuthContext';

export function Header({ title, userName, userRole }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Fecha o dropdown se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <header className="app-header">
            <div className="header-left-blue">
                <img src={logo} alt="Logo" className="logo-img" />
            </div>

            <div className="header-right-white">
                <div className="page-title">
                    <h2>{title}</h2>
                </div>
                
                <div className="user-profile-wrapper" ref={dropdownRef}>
                    <div 
                        className="user-profile" 
                        onClick={() => setMenuOpen(!menuOpen)}
                        title="Opções do usuário"
                    >
                        <div className="avatar-placeholder">{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
                        <div className="user-info">
                            <span className="user-name">{userName}</span>
                            <span className="user-role">{userRole}</span>
                        </div>
                        <img 
                            src={seta} 
                            alt="Menu" 
                            className={`dropdown-icon ${menuOpen ? 'open' : ''}`} 
                        />
                    </div>

                    {menuOpen && (
                        <div className="user-dropdown-menu">
                            <div className="dropdown-user-header">
                                <p className="dropdown-user-name">{userName}</p>
                                <span className="dropdown-user-role">{userRole}</span>
                            </div>
                            <hr className="dropdown-divider" />
                            <button 
                                className="dropdown-logout-btn" 
                                onClick={handleLogout}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Sair da conta
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}