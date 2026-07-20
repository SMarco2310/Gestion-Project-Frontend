<script setup>
import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'focus:outline-none min-h-[120px]',
    },
  },
})

// Sync value from outside if changed externally
watch(() => props.modelValue, (value) => {
  if (editor.value) {
    const isSame = editor.value.getHTML() === value
    if (isSame) {
      return
    }
    editor.value.commands.setContent(value, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* Tiptap specific styling overrides for prose */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
.ProseMirror {
  min-height: 120px;
}
.ProseMirror p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.25rem;
}
.ProseMirror pre {
  background: #1A1A1D;
  color: #E2E8F0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}
.ProseMirror code {
  color: #0891b2;
  background-color: rgba(43, 196, 191, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
</style>


<template>
  <div class="rich-text-editor border border-form-border dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#151515] focus-within:ring-2 focus-within:ring-primary/50 transition-all flex flex-col">
    <!-- Toolbar -->
    <div v-if="editor" class="flex flex-wrap items-center gap-1 p-2 border-b border-form-border dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1D]">
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleBold().run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('bold') }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Gras"
      >
        <Icon name="ph:text-b" class="w-4 h-4" />
      </button>
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleItalic().run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('italic') }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Italique"
      >
        <Icon name="ph:text-italic" class="w-4 h-4" />
      </button>
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleStrike().run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('strike') }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Barré"
      >
        <Icon name="ph:text-strikethrough" class="w-4 h-4" />
      </button>
      
      <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
      
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleHeading({ level: 1 }).run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('heading', { level: 1 }) }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Titre 1"
      >
        <Icon name="ph:text-h-one" class="w-4 h-4" />
      </button>
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleHeading({ level: 2 }).run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('heading', { level: 2 }) }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Titre 2"
      >
        <Icon name="ph:text-h-two" class="w-4 h-4" />
      </button>
      
      <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
      
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleBulletList().run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('bulletList') }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Liste à puces"
      >
        <Icon name="ph:list-bullets" class="w-4 h-4" />
      </button>
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleOrderedList().run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('orderedList') }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Liste numérotée"
      >
        <Icon name="ph:list-numbers" class="w-4 h-4" />
      </button>
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().toggleCodeBlock().run()" 
        :class="{ 'bg-gray-100 dark:bg-gray-700 !text-gray-600 dark:!text-gray-200': editor.isActive('codeBlock') }"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Bloc de code"
      >
        <Icon name="ph:code" class="w-4 h-4" />
      </button>
      
      <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
      
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().undo().run()" 
        :disabled="!editor.can().chain().focus().undo().run()"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Annuler"
      >
        <Icon name="ph:arrow-u-up-left" class="w-4 h-4" />
      </button>
      <button 
        type="button" 
        @click.prevent="editor.chain().focus().redo().run()" 
        :disabled="!editor.can().chain().focus().redo().run()"
        class="p-1.5 rounded text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Rétablir"
      >
        <Icon name="ph:arrow-u-up-right" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- Editor Content -->
    <div class="p-4 flex-1 overflow-y-auto custom-scrollbar prose dark:prose-invert max-w-none text-sm text-main dark:text-gray-200 focus:outline-none focus:ring-0">
      <TiptapEditorContent :editor="editor" />
    </div>
  </div>
</template>

