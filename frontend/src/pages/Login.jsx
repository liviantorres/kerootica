import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';
import logo from '../assets/images/logo.svg';
import userIcon from '../assets/icons/user.svg';
import lockIcon from '../assets/icons/pass.svg';
import '../pages/styles/Login.css';
import { loginRequest } from "../services/authService.js";

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A2846">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A2846">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(evento){
        evento.preventDefault();
        setLoading(true);
        setError('');

        try {
            const dados = await loginRequest(email, password);
            
            // Salva o token retornado pelo backend (ajuste a propriedade se necessário, ex: dados.access_token)
            localStorage.setItem('token', dados.token); 
            
            // Redireciona para a home mapeada no App.jsx
            navigate('/home'); 
        } catch (erro) {
            setError('Credenciais inválidas ou erro no servidor.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <div className="login-banner">
                    <img src={logo} alt="Logo Kerootica" className="logo" />
                    <div className="slogan">
                        <h2>Gestão simples.</h2>
                        <h2 className="highlight">Atendimento Melhor.</h2>
                    </div>
                </div>

                <div className="login-form-section">
                    <div className="login-card">
                        <div className="login-header">
                            <h1>Bem vindo(a)</h1>
                            <p>Acesse sua conta para continuar.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <Input
                                label="E-mail"
                                type="email"
                                placeholder="Digite o seu e-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<img src={userIcon} alt="Ícone de usuário" className="input-user-icon" />}
                                required
                            />
                            <Input
                                label="Senha"
                                type="password"
                                placeholder="Digite a sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<img src={lockIcon} alt="Ícone de senha" className="input-icon-pass" />}
                                required
                            />

                            <a href="#" className="forgot-password">Esqueceu sua senha?</a>
                            
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}