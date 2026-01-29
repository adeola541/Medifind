import axios, { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';


// Production API URL
const API_URL = 'https://glowing-robot-production.up.railway.app/api';


// Generate a session ID that persists until app restart
const SESSION_ID = Math.random().toString(36).substring(7);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-session-id': SESSION_ID
    },
});


// Add interceptor to attach token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        let token;
        if (Platform.OS === 'web') {
            token = localStorage.getItem('token');
        } else {
            token = await SecureStore.getItemAsync('token');
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const fetchHospitals = async () => {
    const response = await api.get('/hospitals');
    return response.data;
};

export const searchDrugs = async (query: string, lat?: number, lng?: number, category?: string) => {
    const response = await api.get('/drugs/compare', {
        params: { search: query, lat, lng, category }
    });
    return response.data;
};

export const validateCart = async (items: any[], lat?: number, lng?: number) => {
    const response = await api.post('/cart/validate', { items, lat, lng });
    return response.data;
};

export const createOrder = async (orderData: { pharmacyId: string, pharmacyName?: string, items: any[], paymentMethod?: 'WALLET' | 'ONLINE' | 'CASH' }) => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const verifyOrderPayment = async (reference: string, orderId: string) => {
    const response = await api.post('/orders/verify', { reference, orderId });
    return response.data;
};

export const getOrders = async () => {
    const response = await api.get('/orders/me');
    return response.data;
};

export const getOrderDetails = async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};

export const fetchFoursquarePlacesNearby = async (lat: number, lng: number) => {
    try {
        const response = await api.get('/pharmacies/discover', {
            params: { lat, lng }
        });
        return response.data;
    } catch (error) {
        console.error('Foursquare Discovery Proxy Failed:', error);
        return [];
    }
};

export const getEnrichedPharmacies = async (externalResults: any[]) => {
    try {
        const fsqIds = externalResults.map(r => r.fsq_id).filter(Boolean);
        if (fsqIds.length === 0) return [];
        const response = await api.get('/pharmacies/search', {
            params: { foursquare_ids: fsqIds.join(',') }
        });
        return response.data;
    } catch (error) {
        console.error('Enrichment Failed:', error);
        return [];
    }
};

export const fetchNearbyPharmacies = async (lat: number, lng: number, radius: number = 10) => {
    const response = await api.get('/pharmacies/search', {
        params: { lat, lng, radius }
    });
    return response.data;
};

export const fetchPharmacyById = async (id: string) => {
    const response = await api.get(`/pharmacies/${id}`);
    return response.data;
};

export const fetchPharmacyReviews = async (id: string) => {
    const response = await api.get(`/pharmacies/${id}/reviews`);
    return response.data;
};

export const getDrugSuggestions = async (query: string) => {
    const response = await api.get('/drugs/suggestions', { params: { search: query } });
    return response.data;
};

export const fetchDrugs = async (params: { search?: string, category?: string }) => {
    const response = await api.get('/drugs', { params });
    return response.data;
};

export const getSavedItems = async () => {
    const response = await api.get('/users/saved');
    return response.data;
};

export const saveItem = async (drugId: string) => {
    const response = await api.post('/users/saved', { drugId });
    return response.data;
};

export const removeSavedItem = async (drugId: string) => {
    const response = await api.delete(`/users/saved/${drugId}`);
    return response.data;
};

export const updateUserLocation = async (latitude: number, longitude: number, address: string) => {
    const response = await api.put('/users/location', { latitude, longitude, address });
    return response.data;
};

export const geocodeAddress = async (address: string) => {
    const response = await api.get('/location/geocode', { params: { address } });
    return response.data;
};

export const reverseGeocodeLocation = async (lat: number, lng: number) => {
    const response = await api.get('/location/reverse', { params: { lat, lng } });
    return response.data;
};

export const fetchWallet = async () => {
    const response = await api.get('/wallet');
    return response.data;
};

export const initializeTopUp = async (amount: number) => {
    const response = await api.post('/wallet/initialize', { amount });
    return response.data;
};

export const verifyTopUp = async (reference: string) => {
    const response = await api.post('/wallet/verify', { reference });
    return response.data;
};

export const simulateWalletTopUp = async (amount: number) => {
    const response = await api.post('/wallet/simulate-topup', { amount });
    return response.data;
};

export const fetchOrder = async (orderId: string) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
};

export const fetchSuggestions = async (query: string) => {
    const response = await api.get('/drugs/suggestions', { params: { search: query } });
    return response.data;
};

export default api;
