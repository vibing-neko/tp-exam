<script setup>
import { ref, watch, onMounted } from 'vue'
import { animate } from 'animejs'
import { reduced } from '../anim.js'

const props = defineProps({ value: { type: Number, default: 0 }, decimals: { type: Number, default: 0 } })
const el = ref(null)
const o = { v: 0 }
let anim

const fmt = v => v.toLocaleString('zh-TW', { minimumFractionDigits: props.decimals, maximumFractionDigits: props.decimals })

function run(to) {
	anim?.pause()
	if (reduced || !el.value) {
		o.v = to
		if (el.value) el.value.textContent = fmt(to)
		return
	}
	anim = animate(o, { v: to, duration: 600, ease: 'outExpo', onUpdate: () => (el.value.textContent = fmt(o.v)) })
}

onMounted(() => run(props.value))
watch(() => props.value, run)
</script>

<template>
	<span ref="el" class="num">0</span>
</template>
