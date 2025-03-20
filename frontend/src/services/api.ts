import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // URL del backend
});

export const getHello = async () => {
    try {
        const response = await api.get('/hello');
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};