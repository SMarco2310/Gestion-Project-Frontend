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
            const data = await $api<{projets:[],success:boolean}>('/api/projets',{
                method:'GET'
            });

            projets.value=data.projets;
            return data.projets
        }catch(error){
            console.error(error)
                throw error
        }
    }

    // get projet
    const getProjet = async (id:number|string|any)=>{
        try{
            const { $api } = useNuxtApp();
            const data = await $api<{projet:Projet,success:boolean} | any>(`/api/projets/${id}`,{
                method:'GET'
            });

            return data.projet ?? data
        }catch(error){
            console.error(error)
                throw error
        }
        
    }

    // create projet

    const createProjet = async (name:string,reference_code:string,description:string,status:string,user_id:number,start_date:string|Date,end_date:string|Date)=>{
        try{
            const { $api } = useNuxtApp();
            const data = await $api<{projet:Projet,success:boolean}>(`/api/projets`,{
                method:'POST',
                body:{
                   name: name,
                   reference_code:reference_code,
                   description:description,
                   status:status,
                   user_id:user_id,
                   start_date:start_date,
                   end_date:end_date,
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
            const data = await $api<{projet:Projet,success:boolean} | any>(`/api/projets/${id}`,{
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
            const data = await $api<{message:string}>(`/api/projets/${id}`,{
                method:"DELETE"
            });

                projets.value = projets.value.filter((p) => String(p.id) !== String(id));
                return data.message;
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