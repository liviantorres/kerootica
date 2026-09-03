import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';
import '../pages/styles/Login.css';
import { loginRequest } from "../services/authService.js";

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
            <h2>Acesso ao Sistema</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </Button>
            </form>
        </div>
    );
}