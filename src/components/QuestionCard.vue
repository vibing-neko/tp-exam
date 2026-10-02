<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { animate, stagger, spring, utils } from 'animejs'
import Icon from './Icon.vue'
import Rich from './Rich.vue'
import { chapterMap, subjects } from '../data/index.js'
import { qStat, toggleStar } from '../store.js'
import { reduced } from '../anim.js'
import { relatedNotes } from '../match.js'

const props = defineProps({
	q: { type: Object, required: true },
	label: { type: String, default: '' }
})
const emit = defineEmits(['answered', 'next'])

const root = ref(null)
const order = ref([])
const picked = ref(-1)
const notes = ref(false)
const hits = computed(() => new Set(relatedNotes(ch.value, props.q)))

function toggleNotes() {
	notes.value = !notes.value
}

// 展開：高度由 0 長到實際高度，條目依序浮現；先在框內捲到相關條目，展開完再閃一下提示
function notesEnter(el, done) {
	const hit = el.querySelector('.hit')
	if (hit) el.scrollTop = hit.offsetTop - el.offsetTop - 40
	const finish = () => {
		el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		if (!reduced && hit) animate(el.querySelectorAll('.hit'), { backgroundColor: ['color-mix(in srgb, var(--volt) 70%, transparent)', 'color-mix(in srgb, var(--volt) 22%, transparent)'], duration: 1400, ease: 'outQuad' })
		done()
	}
	if (reduced) return finish()
	const h = el.offsetHeight
	animate(el, {
		height: [0, h],
		opacity: [0, 1],
		marginTop: [0, 14],
		paddingTop: [0, 12],
		duration: 560,
		ease: 'outExpo',
		onComplete: a => {
			a.revert()
			finish()
		}
	})
	animate(el.querySelectorAll('section'), { opacity: [0, 1], translateY: [10, 0], delay: stagger(45, { start: 80 }), duration: 450, ease: 'outExpo', onComplete: a => a.revert() })
}

// 收合：高度縮回 0
function notesLeave(el, done) {
	if (reduced) return done()
	animate(el, { height: [el.offsetHeight, 0], opacity: 0, marginTop: 0, paddingTop: 0, duration: 340, ease: 'inOutQuad', onComplete: done })
}
const done = computed(() => picked.value >= 0)
const ch = computed(() => chapterMap[props.q.ch])
const starred = computed(() => !!qStat(props.q.id).star)
const letters = ['A', 'B', 'C', 'D']

function shuffle() {
	order.value = utils.shuffle([0, 1, 2, 3])
	picked.value = -1
	notes.value = false
}

async function intro() {
	await nextTick()
	if (reduced || !root.value) return
	animate(root.value.querySelectorAll('.stem, .opt'), {
		opacity: [0, 1],
		translateX: [-14, 0],
		delay: stagger(55),
		duration: 600,
		ease: 'outExpo',
		onComplete: a => a.revert()
	})
}

function burst(el) {
	const box = el.getBoundingClientRect()
	const host = root.value.getBoundingClientRect()
	for (let i = 0; i < 10; i++) {
		const s = document.createElement('i')
		s.className = 'spark'
		s.style.left = box.left - host.left + 30 + 'px'
		s.style.top = box.top - host.top + box.height / 2 + 'px'
		root.value.appendChild(s)
		const a = (Math.PI * 2 * i) / 10
		animate(s, {
			translateX: Math.cos(a) * utils.random(30, 60),
			translateY: Math.sin(a) * utils.random(20, 46),
			scale: [1, 0],
			duration: 700,
			ease: 'outExpo',
			onComplete: () => s.remove()
		})
	}
}

function pick(slot, ev) {
	if (done.value) return
	picked.value = slot
	const ok = order.value[slot] === 0
	const el = ev?.currentTarget || root.value.querySelectorAll('.opt')[slot]
	if (!reduced) {
		if (ok) {
			animate(el, { scale: [0.96, 1], ease: spring({ bounce: 0.6, duration: 500 }), onComplete: a => a.revert() })
			burst(el)
		} else {
			animate(el, { translateX: [0, -9, 9, -6, 6, -2, 0], duration: 460, ease: 'inOutSine', onComplete: a => a.revert() })
		}
	}
	emit('answered', ok)
	nextTick(() => {
		const exp = root.value?.querySelector('.exp')
		if (exp && !reduced) animate(exp, { opacity: [0, 1], translateY: [10, 0], duration: 500, ease: 'outExpo', onComplete: a => a.revert() })
		exp?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
	})
}

function key(e) {
	if (e.target.closest('input, textarea')) return
	const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 }
	const k = e.key.toLowerCase()
	if (!done.value && k in map) pick(map[k])
	else if (done.value && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
		e.preventDefault()
		emit('next')
	}
}

watch(() => props.q.id, () => {
	shuffle()
	intro()
})
shuffle()
onMounted(() => {
	intro()
	addEventListener('keydown', key)
})
onBeforeUnmount(() => removeEventListener('keydown', key))

defineExpose({ done })
</script>

<template>
	<div ref="root" class="qc card">
		<div class="meta">
			<span class="chip" :class="subjects[q.subject].cls">{{ ch.no }} {{ ch.title }}</span>
			<span class="muted mono small">{{ label }}</span>
			<button class="star" :class="{ on: starred }" :aria-label="starred ? '取消收藏' : '收藏到錯題本'" @click="toggleStar(q.id)">
				<Icon name="star" :size="20" />
			</button>
		</div>
		<h2 class="stem">{{ q.q }}</h2>
		<div class="opts">
			<button v-for="(o, slot) in order" :key="q.id + slot" class="opt"
				:class="{ right: done && o === 0, wrong: done && slot === picked && o !== 0, dim: done && o !== 0 && slot !== picked }"
				:disabled="done" @click="pick(slot, $event)">
				<span class="l mono">{{ letters[slot] }}</span>
				<span class="t">{{ q.o[o] }}</span>
				<Icon v-if="done && o === 0" name="check" :size="20" class="mk" />
				<Icon v-else-if="done && slot === picked" name="close" :size="20" class="mk" />
			</button>
		</div>
		<div v-if="done" class="exp">
			<p class="verdict" :class="order[picked] === 0 ? 'ok' : 'no'">
				{{ order[picked] === 0 ? '答對了' : `答錯了，正解是 ${letters[order.indexOf(0)]}` }}
			</p>
			<p class="why">{{ q.e }}</p>
			<div class="exp-acts">
				<button class="muted small link" @click="toggleNotes">{{ notes ? '收起本章重點' : '展開本章重點' }}</button>
				<button class="btn primary" @click="emit('next')">下一題<Icon name="arrow" :size="18" /></button>
			</div>
			<Transition :css="false" @enter="notesEnter" @leave="notesLeave">
			<div v-if="notes" class="notes">
				<section v-for="(s, i) in ch.sections" :key="i">
					<b>{{ s.h }}</b>
					<ul><Rich v-for="(t, j) in s.items" :key="j" tag="li" :text="t" :class="{ hit: hits.has(`${i}-${j}`) }" /></ul>
				</section>
			</div>
			</Transition>
		</div>
		<p v-else class="hint muted small">可用鍵盤 1–4 或 A–D 作答，Enter 到下一題</p>
	</div>
</template>

<style scoped>
.qc {
	position: relative;
	padding: 24px;
	overflow: hidden;
}

.meta {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.small {
	font-size: 13px;
}

.star {
	margin-left: auto;
	border: 0;
	background: transparent;
	color: var(--muted);
	padding: 6px;
	border-radius: 10px;
}

.star.on {
	color: var(--volt);
}

.star.on :deep(path) {
	fill: var(--volt);
}

.stem {
	font-size: clamp(19px, 2.4vw, 23px);
	font-weight: 900;
	line-height: 1.5;
	margin: 16px 0 18px;
}

.opts {
	display: grid;
	gap: 10px;
}

.opt {
	display: grid;
	grid-template-columns: 34px 1fr auto;
	align-items: center;
	gap: 12px;
	width: 100%;
	text-align: left;
	padding: 14px 16px;
	border-radius: 14px;
	border: 1.5px solid var(--line);
	background: var(--bg);
	font-size: 16px;
	line-height: 1.5;
	transition: border-color 0.2s, background 0.2s, opacity 0.2s;
}

.opt:not(:disabled):hover {
	border-color: var(--ink);
	background: var(--card);
}

.opt:disabled {
	cursor: default;
}

.l {
	display: grid;
	place-items: center;
	width: 32px;
	height: 32px;
	border-radius: 10px;
	background: var(--bg-2);
	font-weight: 600;
	font-size: 14px;
}

.opt.right {
	border-color: var(--ok);
	background: var(--ok-soft);
}

.opt.right .l {
	background: var(--ok);
	color: #fff;
}

.opt.wrong {
	border-color: var(--bad);
	background: var(--bad-soft);
}

.opt.wrong .l {
	background: var(--bad);
	color: #fff;
}

.opt.dim {
	opacity: 0.5;
}

.mk {
	color: var(--ok);
}

.opt.wrong .mk {
	color: var(--bad);
}

.exp {
	margin-top: 18px;
	padding: 16px 18px;
	border-radius: 14px;
	background: var(--bg-2);
}

.verdict {
	margin: 0 0 4px;
	font-weight: 900;
}

.verdict.ok {
	color: var(--ok);
}

.verdict.no {
	color: var(--bad);
}

.why {
	margin: 0;
	color: var(--ink-2);
}

.exp-acts {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin-top: 14px;
}

.link {
	border: 0;
	background: transparent;
	padding: 0;
	text-decoration: underline;
	text-underline-offset: 3px;
}

.notes {
	margin-top: 14px;
	padding-top: 12px;
	border-top: 1px dashed var(--line-2);
	max-height: 50vh;
	overflow-y: auto;
	font-size: 14px;
}

.notes li.hit {
	position: relative;
	margin-left: -10px;
	padding: 4px 8px 4px 10px;
	border-radius: 8px;
	background: color-mix(in srgb, var(--volt) 22%, transparent);
	box-shadow: inset 3px 0 0 var(--volt);
	list-style: none;
}

.notes li.hit::before {
	content: '本題相關';
	display: block;
	font-size: 11px;
	font-weight: 700;
	color: var(--ink-2);
	letter-spacing: 0.06em;
}

.notes ul {
	margin: 4px 0 12px;
	padding-left: 1.1em;
}

.hint {
	margin: 14px 0 0;
}

.qc :deep(.spark) {
	position: absolute;
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: var(--ok);
	pointer-events: none;
}

.qc :deep(.spark:nth-child(odd)) {
	background: var(--volt);
}

@media (max-width: 520px) {
	.qc {
		padding: 18px;
	}

	.opt {
		padding: 12px;
		font-size: 15px;
	}
}
</style>
