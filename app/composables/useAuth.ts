import { ref } from 'vue'

interface AuthUser {
    id: string;
    nom: string;
    email: string;}
    

export const useAuth = () => {
    
    const user = ref<AuthUser | null>(null);

    const register = async () => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

    const login = async (credentials: { email: string, password: string }) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            user.value = data.user;
            return data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };
    



}
