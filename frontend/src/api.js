import axios from 'axios';

// Tworzymy instancję axiosa domyślnie celującą w naszego Spring Boota
const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

// Zanim zapytanie wyleci do backendu, dodajemy token z pamięci przeglądarki
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;