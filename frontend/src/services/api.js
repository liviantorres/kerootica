/* Nesse arquivo o sistema "conversa" com o backend */
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})