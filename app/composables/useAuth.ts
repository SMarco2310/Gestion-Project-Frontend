import { ref } from 'vue'

interface AuthUser {
    id: string;
    nom: string;
    email: string;}
    

export const useAuth = () => {
    
    const user = ref<AuthUser | null>(null);



}
