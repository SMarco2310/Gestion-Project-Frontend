<script setup lang="ts">

 
const props = defineProps({
    id: {
        type: Number,
        required: true
    },
    reference_code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    end_date: {
        type: String,
        required: true
    }
})

// A simple native function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

</script>

<template>
    <!-- ProjetCard Component -->
    <div id="project-card" class="flex gap-5 flex-col w-full bg-[#1D1D1D] border border-gray-600 rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow">
        <div id="project-card-header" class="flex justify-between items-center text-gray-400 text-sm font-bold">
            <span>{{ props.reference_code }}</span>
            <div class="flex items-center gap-3">
                <span :class="{ 'px-3 py-1 rounded-md border border-red-600 bg-red-600/20' : props.status == 'EN_COURS' , 'px-3 py-1 rounded-md border border-blue-600 bg-blue-600/20' : props.status == 'IS_DONE' , 'px-3 py-1 rounded-md border border-yellow-600 bg-yellow-600/20' : props.status == 'TO_DO'}"><Icon name="HeroIcons:circle-dotted" class="w-3 h-3 mr-1 inline-block"/>{{ props.status }}</span>
                <div class="cursor-pointer p-1 -mr-2 hover:bg-gray-700 rounded-md transition-colors"><Icon name="heroicons:ellipsis-vertical" class="w-5 h-5 text-gray-400" /></div>
            </div>
        </div>
        <div id="project-card-body" class="py-2">
            <h1 class="text-2xl font-bold text-gray-300 pb-5">{{ props.name }}</h1>
            <!-- <p class="text-gray-400 pt-2 text-md">{{ props.description }}</p> -->
        
            <div id="task-progress-bar-container" class="flex flex-col gap-2 pt-3">
                <div class="flex justify-between">
                <span class="text-gray-400 flex justify-left text-sm">Task Progress </span>
                <span class="text-gray-400 flex justify-left text-sm">75%</span>
                </div>
                <div id="task-progress-bar" class="w-full h-2 bg-gray-700 rounded-lg overflow-hidden">
                    <div id="task-progress" class="h-[10px] bg-blue-600" :style="{ width: '75%' }"></div>
                </div>
            </div>
            
            <div id="ticket-status-bar-container" class="flex flex-col gap-2 pt-6">
                <span class="text-gray-400 flex justify-left text-sm">Ticket Progress</span>
                <!-- Multi-segment Progress Bar -->
                <div class="flex h-1.5 w-full gap-1">
                    <div class="bg-[#9BA9CE] h-full rounded-l-full" style="width: 40%"></div>
                    <div class="bg-[#B3CFFF] h-full" style="width: 27%"></div>
                    <div class="bg-[#454A59] h-full rounded-r-full" style="width: 33%"></div>
                </div>
                
                <!-- Labels -->
                <div class="flex justify-between text-xs font-semibold text-gray-300 pt-1 ">
                    <span>12 Done</span>
                    <span>8 In Prog</span>
                    <span>10 To Do</span>
                </div>
            </div>
            
        </div>
        <div id="project-card-footer" class="flex items-center justify-between">
            <div id="project-card-footer-right" class="flex items-center gap-2">
                <Icon name="heroicons:users" class="w-5 h-5 text-gray-400" />
            </div>
            <div id="project-card-footer-left" class="flex items-center gap-2">
            <span class=" flex text-gray-400 text-sm font-bold justify-center"><Icon name="heroicons:calendar" class="w-5 h-5 text-gray-400 pr-1" /> <span class="pb-1.5 mx-1">{{ formatDate(props.end_date) }}</span></span>
            </div>
        </div>

    </div>

</template>