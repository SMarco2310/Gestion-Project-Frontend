import { ProjectStatus } from '~/utils/enums';


interface Projet{
  name: string,
  description:string,
  reference_code:string,
  status:ProjectStatus,
  start_date: string|Date,
  end_date: string|Date,
  user_id:number|any|string,
  created_at: string,
  updated_at: string,
  id: number|string|any,
}

export default function useProjets() {

      const projets = useState<Projet[]>('projets', () => [])
    const token = useCookie('auth_token', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
        secure: true,
    })
    // get projets
    const getProjets = async ()=>{
        try{
            const { $api } = useNuxtApp();
            const { activeOrganization } = useOrganizations();
            const query = activeOrganization.value?.id ? `?organization_id=${activeOrganization.value.id}` : '';
            const data = await $api<any>(`/projets${query}`,{
                method:'GET'
            });

            projets.value = data.data?.data ?? data.data ?? data.projets ?? [];
            return projets.value;
        }catch(error){
            console.error(error)
                throw error
        }
    }

    // get projet
    const getProjet = async (id:number|string|any)=>{
        try{
            const { $api } = useNuxtApp();
            const data = await $api<{projet:Projet,success:boolean} | any>(`/projets/${id}`,{
                method:'GET'
            });

            return data.data ?? data.projet ?? data;
        }catch(error){
            console.error(error)
                throw error
        }
        
    }

    // create projet

    const createProjet = async (name:string,description:string,status:string,start_date:string|Date,end_date:string|Date)=>{
        try{
            const { $api } = useNuxtApp();
            const { activeOrganization } = useOrganizations();
            const data = await $api<{projet:Projet,success:boolean}>(`/projets`,{
                method:'POST',
                body:{
                   name: name,
                   description:description,
                   status:status,
                   start_date:start_date,
                   end_date:end_date,
                   organization_id: activeOrganization.value?.id
                }
            });

            console.log(data)
            return data.projet ?? data
        }catch(error){
            console.error(error)
                throw error
        }
        
    }



    // update projet

    const updateProjet = async (id:number,name:string,description:string,start_date:string|Date,end_date:string|Date,status:string)=>{
        try{
            const { $api } = useNuxtApp();
            const data = await $api<{projet:Projet,success:boolean} | any>(`/projets/${id}`,{
                method:'PUT',
                body:{
                    name:name,
                    description:description,
                    status:status,
                    start_date:start_date,
                    end_date:end_date,
                }
            });
            const proj = data.projet ?? data
            const index = projets.value.findIndex(p => String(p.id) === String(id))
             if (index !== -1) projets.value[index] = proj
            return proj
        }catch(error){
            console.error(error)
                throw error
        }
        
    }

    const deleteProjet = async (id:number|string|any)=>{
        try{
            const { $api } = useNuxtApp();
            const data = await $api<{message:string,success:boolean}>(`/projets/${id}`,{
                method:"DELETE"
            });
            projets.value = projets.value.filter((p) => String(p.id) !== String(id));
            return data.message ?? data.success;
        }catch(error){
            console.error(error)
            throw error
        }
    }   

    return {
        projets,
        getProjet,
        getProjets,
        createProjet,
        updateProjet,
        deleteProjet
    }

}