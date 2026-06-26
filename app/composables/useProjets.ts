interface Projet{
   id: number,
  name: string,
  reference_code:string,
  user_id:number|any|string,
  description:string,
  created_at: string,
  updated_at: string
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
            const data = await $fetch<{projets:[],succes:boolean}>('http://localhost:8000/api/projets',{
                method:'GET',
                headers:{Authorization:`Bearer ${token.value}`}
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
            const data = await $fetch<{projet:Projet,succes:boolean}>(`http://localhost:8000/api/projets/${id}`,{
                method:'GET',
                headers:{Authorization:`Bearer ${token.value}`}
            });

            return data.projet
        }catch(error){
            console.error(error)
                throw error
        }
        
    }

    // create projet

    const createProjet = async (name:string,description:string,reference_code:string,end_date:Date,status:string,user_id:number)=>{
        try{
            const data = await $fetch<{projet:Projet,succes:boolean}>(`http://localhost:8000/api/projets`,{
                method:'POST',
                headers:{Authorization:`Bearer ${token.value}`},
                
                body:{
                    name:name,
                    reference_code:reference_code,
                    description:description,
                    end_date:end_date,
                    status:status,
                    user_id:user_id
                }
            });
            return data.projet
        }catch(error){
            console.error(error)
                throw error
        }
        
    }



    // update projet

    const updateProjet = async (id:number,name:string,description:string,end_date:Date,status:string)=>{
        try{
            const data = await $fetch<{projet:Projet,succes:boolean}>(`http://localhost:8000/api/projets/${id}`,{
                method:'PUT',
                headers:{Authorization:`Bearer ${token.value}`},
                body:{
                    name:name,
                    description:description,
                    end_date:end_date,
                    status:status

                }
            });
            const index = projets.value.findIndex(p => p.id === id)
             if (index !== -1) projets.value[index] = data.projet
            return data.projet
        }catch(error){
            console.error(error)
                throw error
        }
        
    }

    const deleteProjet = async (id:number|string|any)=>{
        try{
            const data = await $fetch<{message:string}>(`http://localhost:8000/api/projets/${id}`,{
                method:"DELETE",
                headers:{Authorization:`Bearer ${token.value}`}});


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