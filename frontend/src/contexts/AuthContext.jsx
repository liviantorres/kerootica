import { createContext, useContext, useState, useEffect } from 'react';
import { isTokenValid } from '../utils/token';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        const savedToken = localStorage.getItem('token');
        if (isTokenValid(savedToken)) {
            return savedToken;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        return null;
    });

    const [usuario, setUsuario] = useState(() => {
        const savedToken = localStorage.getItem('token');
        if (!isTokenValid(savedToken)) return null;
        
        const savedUser = localStorage.getItem('usuario');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    // Desloga automaticamente se qualquer requisição receber 401 (Não Autorizado)
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = (dados) => {
        if (!dados || !isTokenValid(dados.token)) {
            throw new Error('Token inválido retornado pelo servidor.');
        }

        localStorage.setItem('token', dados.token);
        setToken(dados.token);

        if (dados.usuario) {
            localStorage.setItem('usuario', JSON.stringify(dados.usuario));
            setUsuario(dados.usuario);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
    };

    const isAuthenticated = isTokenValid(token);

    return (
        <AuthContext.Provider value={{ token, usuario, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
    }
    return context;
}
