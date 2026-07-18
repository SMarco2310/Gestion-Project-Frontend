import { ProjectStatus } from '~/utils/enums';


interface Projet{
  name: string,
  description:string,
  reference_code:string,
  status:ProjectStatus,
  color?: string,
  start_date: string|Date,
  end_date: string|Date,
  user_id:number|any|string,
  created_at: string,
  updated_at: string,
  id: number|string|any,
  is_archived?: boolean,
  teams?: any[],
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
            const route = useRoute();
            const { activeOrganization } = useOrganizations();
            const { activeWorkspace } = useWorkspaces();
            
            const wsId = activeWorkspace.value?.id || route?.params?.workspace_id;
            const orgId = activeOrganization.value?.id || route?.params?.org_id;

            let query = '';
            if (wsId) {
                query = `?workspace_id=${wsId}`;
            } else if (orgId) {
                query = `?organization_id=${orgId}`;
            }
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
        if (!id || id === 'NaN' || isNaN(Number(id))) {
             return null;
        }
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

    const createProjet = async (name:string,description:string,status:string,start_date:string|Date|null,end_date:string|Date|null, color:string = 'purple', team_ids:number[]=[], user_ids:number[]=[])=>{
        try{
            const { $api } = useNuxtApp();
            const { activeOrganization } = useOrganizations();
            const { activeWorkspace } = useWorkspaces();
            const data = await $api<{projet:Projet,success:boolean}>(`/projets`,{
                method:'POST',
                body:{
                   name: name,
                   description:description,
                   status:status,
                   color:color,
                   start_date: start_date === '' ? null : start_date,
                   end_date: end_date === '' ? null : end_date,
                   organization_id: activeOrganization.value?.id,
                   workspace_id: activeWorkspace.value?.id,
                   team_ids: team_ids,
                   user_ids: user_ids
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

    const updateProjet = async (id:number,name:string,description:string,start_date:string|Date|null,end_date:string|Date|null,status:string,color:string = 'purple', team_ids:number[]=[], user_ids:number[]=[])=>{
        if (!id || isNaN(Number(id))) {
             throw new Error('Invalid Project ID');
        }
        try{
            const { $api } = useNuxtApp();
            const body = {
                name:name,
                description:description,
                status:status,
                color:color,
                start_date: start_date === '' ? null : start_date,
                end_date: end_date === '' ? null : end_date,
                team_ids: team_ids,
                user_ids: user_ids
            };
            // console.log('Sending payload:', body);
            const data = await $api<{projet:Projet,success:boolean} | any>(`/projets/${id}`,{
                method:'PUT',
                body: body
            });
            const proj = data.projet ?? data
            const index = projets.value.findIndex(p => String(p.id) === String(id))
            if (index !== -1) {
                projets.value.splice(index, 1, proj)
            }
            return proj
        }catch(error: any){
            console.error('Update Projet Error:', error.response?._data || error.data || error)
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

    const archiveProjet = async (id: number | string, isArchived: boolean) => {
        try {
            const { $api } = useNuxtApp()
            const data = await $api<any>(`/projets/${id}`, {
                method: 'PUT',
                body: { is_archived: isArchived }
            })
            const proj = data.projet ?? data
            const index = projets.value.findIndex(p => String(p.id) === String(id))
            if (index !== -1) {
                const found = projets.value[index]
                if (found) found.is_archived = isArchived
            }
            return proj
        } catch (error: any) {
            console.error('Archive Projet Error:', error)
            throw error
        }
    }

    const uploadProjectAttachment = async (projectId: string | number, file: File) => {
        try {
            const { $api } = useNuxtApp()
            const formData = new FormData()
            formData.append('file', file)
            
            const data = await $api<any>(`/projets/${projectId}/attachments`, {
                method: 'POST',
                body: formData
            })
            return data
        } catch (error: any) {
            console.error('Upload Attachment Error:', error)
            throw error
        }
    }

    const deleteProjectAttachment = async (attachmentId: string) => {
        try {
            const { $api } = useNuxtApp()
            const data = await $api<any>(`/projets/attachments/${attachmentId}`, {
                method: 'DELETE'
            })
            return data
        } catch (error: any) {
            console.error('Delete Attachment Error:', error)
            throw error
        }
    }

    return {
        projets,
        getProjet,
        getProjets,
        createProjet,
        updateProjet,
        deleteProjet,
        archiveProjet,
        uploadProjectAttachment,
        deleteProjectAttachment
    }

}