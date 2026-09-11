import logo from '../assets/images/logo-header.svg';
import '../assets/styles/Header.css'; 
import seta from '../assets/icons/seta_baixo.svg';

export function Header({ title, userName, userRole }) {
    return (
        <header className="app-header">
            <div className="header-left-blue">
                <img src={logo} alt="Logo" className="logo-img" />
            </div>

            <div className="header-right-white">
                <div className="page-title">
                    <h2>{title}</h2>
                </div>
                
                <div className="user-profile">
                    {/* Pega a primeira letra do nome para o Avatar */}
                    <div className="avatar-placeholder">{userName ? userName.charAt(0) : 'U'}</div>
                    <div className="user-info">
                        <span className="user-name">{userName}</span>
                        <span className="user-role">{userRole}</span>
                    </div>
                    <img src={seta} alt="Menu" className="dropdown-icon" />
                </div>
            </div>
        </header>
    );
}