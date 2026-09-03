import api from './api';

export async function loginRequest(email, senha){
    // Mude para a chave correta que o backend valida (ex: email_login)
    const response = await api.post('/api/auth/login', { 
        email_login: email, 
        senha: senha 
    });
    return response.data;
}