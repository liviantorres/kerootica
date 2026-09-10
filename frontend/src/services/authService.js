import api from './api';

export async function loginRequest(email, senha){
    
    const response = await api.post('/api/auth/login', { 
        email_login: email, 
        senha: senha 
    });
    return response.data;
}