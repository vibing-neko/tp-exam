<script setup>
import { computed } from 'vue'

const props = defineProps({ text: { type: String, default: '' }, tag: { type: String, default: 'span' } })

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const html = computed(() => esc(props.text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
</script>

<template>
	<component :is="tag" v-html="html" />
</template>
