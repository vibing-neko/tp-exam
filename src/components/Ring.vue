<script setup>
import { ref, onMounted, watch } from 'vue'
import { animate } from 'animejs'
import { reduced } from '../anim.js'

const props = defineProps({
	value: { type: Number, default: 0 },
	size: { type: Number, default: 64 },
	stroke: { type: Number, default: 6 },
	color: { type: String, default: 'var(--ink)' },
	label: { type: String, default: '' }
})

const r = (props.size - props.stroke) / 2
const c = 2 * Math.PI * r
const arc = ref(null)
const txt = ref(null)
let shown = 0

function draw(to) {
	const o = { v: shown }
	const set = () => {
		arc.value?.setAttribute('stroke-dashoffset', c * (1 - o.v))
		if (txt.value && !props.label) txt.value.textContent = Math.round(o.v * 100) + '%'
	}
	if (reduced) {
		o.v = to
		set()
	} else {
		animate(o, { v: to, duration: 1200, ease: 'outExpo', onUpdate: set })
	}
	shown = to
}

onMounted(() => draw(props.value))
watch(() => props.value, v => draw(v))
</script>

<template>
	<div class="ring" :style="{ width: size + 'px', height: size + 'px' }">
		<svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
			<circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="var(--line)" :stroke-width="stroke" />
			<circle ref="arc" :cx="size / 2" :cy="size / 2" :r="r" fill="none" :stroke="color" :stroke-width="stroke"
				stroke-linecap="round" :stroke-dasharray="c" :stroke-dashoffset="c"
				:transform="`rotate(-90 ${size / 2} ${size / 2})`" />
		</svg>
		<span ref="txt" class="num">{{ label }}</span>
	</div>
</template>

<style scoped>
.ring {
	position: relative;
	display: inline-grid;
	place-items: center;
	flex: none;
}

.ring svg {
	position: absolute;
	inset: 0;
}

.ring span {
	font-size: 13px;
	font-weight: 700;
}
</style>
