// @ts-ignore
import { create } from 'zustand';
// @ts-ignore
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    signIn: (token: string, user: User) => Promise<void>;
    signOut: () => Promise<void>;
    loadUser: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set: any) => ({
    user: null,
    token: null,
    isLoading: true,

    signIn: async (token: string, user: User) => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                await SecureStore.setItemAsync('token', token);
                await SecureStore.setItemAsync('user', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Failed to save session', error);
        }
        set({ token, user });
    },

    signOut: async () => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } else {
                await SecureStore.deleteItemAsync('token');
                await SecureStore.deleteItemAsync('user');
            }
        } catch (error) {
            console.error('Failed to clear session', error);
        }
        set({ token: null, user: null });
    },

    loadUser: async () => {
        try {
            let token, userStr;
            if (Platform.OS === 'web') {
                token = localStorage.getItem('token');
                userStr = localStorage.getItem('user');
            } else {
                token = await SecureStore.getItemAsync('token');
                userStr = await SecureStore.getItemAsync('user');
            }

            if (token && userStr) {
                set({ token, user: JSON.parse(userStr), isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to load user', error);
            set({ isLoading: false });
        }
    },

    updateUser: async (user: User) => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                await SecureStore.setItemAsync('user', JSON.stringify(user));
            }
            set({ user });
        } catch (error) {
            console.error('Failed to update local user session', error);
        }
    },
}));
