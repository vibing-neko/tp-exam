<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { animate, createDraggable, spring, utils } from 'animejs'
import Icon from '../components/Icon.vue'
import { chapters, chapterMap, subjects } from '../data/index.js'
import { cardDeck, gradeCard, cardStat } from '../store.js'
import { reduced } from '../anim.js'

const route = useRoute()
const subject = ref(0)
const ch = ref(route.query.ch || '')
const deck = ref([])
const pos = ref(0)
const flipped = ref(false)
const tally = ref({ yes: 0, no: 0 })
const slot = ref(null)
const card = ref(null)
let drag = null
let moved = false
let busy = false

const cur = computed(() => deck.value[pos.value])
const rest = computed(() => deck.value.slice(pos.value + 1, pos.value + 3))
const doneAll = computed(() => pos.value >= deck.value.length)

function load() {
	deck.value = cardDeck({ subject: subject.value, ch: ch.value }).slice(0, 30)
	pos.value = 0
	tally.value = { yes: 0, no: 0 }
	flipped.value = false
	bind()
}

function flip() {
	if (moved || !card.value) return
	flipped.value = !flipped.value
	const rotateY = flipped.value ? 180 : 0
	animate(card.value.querySelector('.inner'), reduced ? { rotateY, duration: 1 } : { rotateY, ease: spring({ bounce: 0.3, duration: 650 }) })
}

function decide(known) {
	if (busy || !cur.value) return
	busy = true
	const dir = known ? 1 : -1
	const el = slot.value
	const x = drag ? drag.x : 0
	drag?.revert()
	drag = null
	if (card.value) card.value.style.rotate = ''
	utils.set(el, { x, rotate: x / 18 })
	animate(el, {
		x: dir * Math.max(innerWidth, 600),
		rotate: dir * 28,
		opacity: 0,
		duration: reduced ? 1 : 420,
		ease: 'inQuad',
		onComplete: () => {
			gradeCard(cur.value.id, known)
			tally.value[known ? 'yes' : 'no']++
			pos.value++
			flipped.value = false
			busy = false
			bind()
		}
	})
}

async function bind() {
	await nextTick()
	drag?.revert()
	drag = null
	if (!card.value) return
	if (!reduced) animate(slot.value, { scale: [0.94, 1], opacity: [0, 1], duration: 450, ease: 'outExpo' })
	drag = createDraggable(card.value, {
		y: false,
		container: slot.value,
		containerFriction: 0.25,
		onGrab: () => (moved = false),
		onDrag: d => {
			if (Math.abs(d.x) > 6) moved = true
			card.value.style.rotate = `${d.x / 18}deg`
			slot.value.dataset.lean = d.x > 60 ? 'yes' : d.x < -60 ? 'no' : ''
		},
		onRelease: d => {
			slot.value.dataset.lean = ''
			if (Math.abs(d.x) > 110) decide(d.x > 0)
			else card.value.style.rotate = '0deg'
			setTimeout(() => (moved = false), 50)
		}
	})
}

function key(e) {
	if (doneAll.value) return
	if (e.key === ' ' || e.key === 'Enter') {
		e.preventDefault()
		flip()
	} else if (e.key === 'ArrowRight') decide(true)
	else if (e.key === 'ArrowLeft') decide(false)
}

watch([subject, ch], load)
onMounted(() => {
	load()
	addEventListener('keydown', key)
})
onBeforeUnmount(() => {
	drag?.revert()
	removeEventListener('keydown', key)
})
</script>

<template>
	<main class="page wrap narrow">
		<p class="eyebrow">Flashcards</p>
		<h1 class="h1">速記卡</h1>
		<p class="lead">點卡片看答案，<b>往右拖＝記得</b>、<b>往左拖＝再看一次</b>。也可以用鍵盤：空白鍵翻面、← →判定。沒記住的卡片會優先回來。</p>

		<div class="filters">
			<div class="seg">
				<button :class="{ on: !ch && subject === 0 }" @click="ch = ''; subject = 0">全部</button>
				<button :class="{ on: !ch && subject === 1 }" @click="ch = ''; subject = 1">科目一</button>
				<button :class="{ on: !ch && subject === 2 }" @click="ch = ''; subject = 2">科目二</button>
			</div>
			<select v-model="ch" class="sel">
				<option value="">依章節…</option>
				<option v-for="c in chapters" :key="c.id" :value="c.id">{{ c.no }}　{{ c.title }}</option>
			</select>
		</div>

		<div class="hud">
			<span class="num">{{ Math.min(pos + 1, deck.length) }} / {{ deck.length }}</span>
			<span class="yes num"><Icon name="check" :size="16" />{{ tally.yes }}</span>
			<span class="no num"><Icon name="reset" :size="16" />{{ tally.no }}</span>
		</div>

		<div class="stage">
			<template v-if="!doneAll && cur">
				<div v-for="(k, i) in rest.slice().reverse()" :key="k.id" class="ghost card" :style="{ '--i': rest.length - i }" />
				<div :key="cur.id" ref="slot" class="slot">
					<div ref="card" class="swipe" @click="flip">
						<div class="inner">
							<div class="face front">
								<span class="chip" :class="subjects[cur.subject].cls">{{ chapterMap[cur.ch].no }} {{ chapterMap[cur.ch].title }}</span>
								<p class="f">{{ cur.f }}</p>
								<span class="tip muted"><Icon name="flip" :size="16" />點擊翻面</span>
								<span v-if="cardStat(cur.id).n" class="lv mono">Lv.{{ cardStat(cur.id).b }}</span>
							</div>
							<div class="face back">
								<span class="eyebrow">答案</span>
								<p class="b">{{ cur.b }}</p>
							</div>
						</div>
					</div>
					<span class="lean-tag yes">記得</span>
					<span class="lean-tag no">再看</span>
				</div>
			</template>
			<div v-else class="finish card">
				<h2 class="h2">這一疊完成了</h2>
				<p class="muted">記得 {{ tally.yes }} 張，再看 {{ tally.no }} 張。</p>
				<button class="btn volt" @click="load"><Icon name="reset" :size="18" />再抽一疊</button>
			</div>
		</div>

		<div v-if="!doneAll && cur" class="btns">
			<button class="btn big no" @click="decide(false)"><Icon name="back" :size="18" />再看</button>
			<button class="btn big" @click="flip"><Icon name="flip" :size="18" />翻面</button>
			<button class="btn big yes" @click="decide(true)">記得<Icon name="arrow" :size="18" /></button>
		</div>
	</main>
</template>

<style scoped>
.narrow {
	max-width: 760px;
}

.filters {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin: 24px 0 12px;
}

.sel {
	font: inherit;
	font-size: 14px;
	padding: 8px 12px;
	border-radius: 99px;
	border: 1px solid var(--line-2);
	background: var(--card);
	color: var(--ink);
	max-width: 100%;
}

.hud {
	display: flex;
	gap: 16px;
	align-items: center;
	font-weight: 700;
}

.hud span {
	display: inline-flex;
	align-items: center;
	gap: 4px;
}

.hud .yes {
	color: var(--ok);
}

.hud .no {
	color: var(--s2);
}

.stage {
	position: relative;
	height: 380px;
	margin-top: 14px;
}

.ghost {
	position: absolute;
	inset: 0;
	transform: translateY(calc(var(--i) * 12px)) scale(calc(1 - var(--i) * 0.04));
	transform-origin: center bottom;
	opacity: calc(1 - var(--i) * 0.3);
}

.slot {
	position: absolute;
	inset: 0;
	perspective: 1200px;
}

.swipe {
	position: absolute;
	inset: 0;
	cursor: grab;
	touch-action: pan-y;
	transition: rotate 0.3s;
	user-select: none;
}

.swipe:active {
	cursor: grabbing;
}

.inner {
	position: relative;
	width: 100%;
	height: 100%;
	transform-style: preserve-3d;
}

.face {
	position: absolute;
	inset: 0;
	border-radius: 24px;
	padding: 28px;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	display: flex;
	flex-direction: column;
	gap: 12px;
	border: 1px solid var(--line);
	box-shadow: var(--shadow);
	overflow: auto;
}

.front {
	background: var(--card);
	align-items: flex-start;
}

.back {
	background: var(--ink);
	color: var(--bg);
	transform: rotateY(180deg);
	justify-content: center;
}

.back .eyebrow {
	color: var(--volt);
}

.f {
	flex: 1;
	display: grid;
	align-content: center;
	font-size: clamp(22px, 4vw, 30px);
	font-weight: 900;
	line-height: 1.4;
	margin: 0;
}

.b {
	font-size: clamp(18px, 3vw, 23px);
	font-weight: 700;
	line-height: 1.6;
	margin: 0;
}

.tip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
}

.lv {
	position: absolute;
	right: 22px;
	top: 26px;
	font-size: 12px;
	color: var(--muted);
}

.lean-tag {
	position: absolute;
	top: 24px;
	padding: 6px 16px;
	border-radius: 12px;
	font-weight: 900;
	font-size: 20px;
	border: 3px solid currentColor;
	opacity: 0;
	transition: opacity 0.15s;
	pointer-events: none;
	background: var(--card);
}

.lean-tag.yes {
	left: 24px;
	color: var(--ok);
	rotate: -10deg;
}

.lean-tag.no {
	right: 24px;
	color: var(--s2);
	rotate: 10deg;
}

.slot[data-lean='yes'] .lean-tag.yes,
.slot[data-lean='no'] .lean-tag.no {
	opacity: 1;
}

.btns {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 10px;
	margin-top: 34px;
}

.big {
	min-height: 52px;
}

.btn.yes {
	border-color: var(--ok);
	color: var(--ok);
}

.btn.no {
	border-color: var(--s2);
	color: var(--s2);
}

.finish {
	position: absolute;
	inset: 0;
	display: grid;
	place-content: center;
	justify-items: center;
	text-align: center;
	padding: 24px;
}

@media (max-width: 520px) {
	.stage {
		height: 340px;
	}

	.face {
		padding: 20px;
	}
}
</style>
