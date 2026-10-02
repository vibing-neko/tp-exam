<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { animate, createScope, onScroll, spring } from 'animejs'
import Rich from '../components/Rich.vue'
import Ring from '../components/Ring.vue'
import Icon from '../components/Icon.vue'
import { chapters, chapterMap, subjects } from '../data/index.js'
import { chapterStats } from '../store.js'
import { reveal } from '../anim.js'

const props = defineProps({ id: String })
const ch = computed(() => chapterMap[props.id] || chapters[0])
const sub = computed(() => subjects[ch.value.subject])
const st = computed(() => chapterStats(ch.value.id))
const idx = computed(() => chapters.indexOf(ch.value))
const prev = computed(() => chapters[idx.value - 1])
const next = computed(() => chapters[idx.value + 1])

const root = ref(null)
const active = ref(0)
const flipped = ref({})
let scope

function goto(i) {
	root.value.querySelector(`#sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function flip(i, e) {
	flipped.value[i] = !flipped.value[i]
	animate(e.currentTarget.querySelector('.inner'), {
		rotateY: flipped.value[i] ? 180 : 0,
		ease: spring({ bounce: 0.35, duration: 700 })
	})
}

onMounted(() => {
	scope = createScope({ root: root.value }).add(() => {
		root.value.querySelectorAll('.sec').forEach((el, i) => {
			onScroll({
				target: el,
				enter: 'center top',
				leave: 'center bottom',
				onEnterForward: () => (active.value = i),
				onEnterBackward: () => (active.value = i)
			})
		})
		reveal(root.value)
	})
})
onBeforeUnmount(() => scope?.revert())
</script>

<template>
	<main ref="root" class="page wrap">
		<RouterLink to="/map" class="backlink muted"><Icon name="back" :size="18" />學習地圖</RouterLink>

		<header class="head">
			<div>
				<span class="chip" :class="sub.cls">{{ sub.name }} · {{ ch.no }}</span>
				<h1 class="h1">{{ ch.title }}</h1>
				<p class="lead">{{ ch.brief }}</p>
				<div class="acts">
					<RouterLink :to="`/practice?ch=${ch.id}`" class="btn volt"><Icon name="bolt" />練這章 {{ ch.questions.length }} 題</RouterLink>
					<RouterLink :to="`/cards?ch=${ch.id}`" class="btn"><Icon name="cards" />這章速記卡</RouterLink>
				</div>
			</div>
			<div class="meter card">
				<Ring :value="st.mastery" :size="96" :stroke="8" :color="`var(--${sub.cls})`" />
				<div class="small">
					<p>已練 <b class="num">{{ st.seen }}</b> / {{ st.n }}</p>
					<p>正確率 <b class="num">{{ Math.round(st.acc * 100) }}%</b></p>
					<p>熟練 <b class="num">{{ st.mastered }}</b> 題</p>
				</div>
			</div>
		</header>

		<div class="body">
			<aside class="toc">
				<p class="eyebrow">本章目錄</p>
				<button v-for="(s, i) in ch.sections" :key="i" :class="{ on: active === i }" @click="goto(i)">
					<span class="num">{{ String(i + 1).padStart(2, '0') }}</span>{{ s.h }}
				</button>
				<button v-if="ch.formulas.length" :class="{ on: active === ch.sections.length }" @click="goto(ch.sections.length)">
					<span class="num">Σ</span>公式
				</button>
			</aside>

			<div class="content">
				<section v-for="(s, i) in ch.sections" :id="`sec-${i}`" :key="i" class="sec card" data-reveal="0">
					<h2><span class="num">{{ String(i + 1).padStart(2, '0') }}</span>{{ s.h }}</h2>
					<ul>
						<Rich v-for="(t, j) in s.items" :key="j" tag="li" :text="t" />
					</ul>
				</section>

				<section v-if="ch.formulas.length" :id="`sec-${ch.sections.length}`" class="sec card formulas" data-reveal="0">
					<h2><span class="num">Σ</span>公式與計算</h2>
					<div v-for="(f, i) in ch.formulas" :key="i" class="f">
						<b>{{ f.name }}</b>
						<code>{{ f.expr }}</code>
						<small v-if="f.note" class="muted">{{ f.note }}</small>
					</div>
				</section>

				<section class="deck" data-reveal="0">
					<h2 class="h2">本章速記卡 <small class="muted">點一下翻面</small></h2>
					<div class="mini-cards">
						<button v-for="(k, i) in ch.cards" :key="i" class="mc" @click="flip(i, $event)">
							<div class="inner">
								<div class="face front"><span class="eyebrow">Q</span>{{ k.f }}</div>
								<div class="face back"><span class="eyebrow">A</span>{{ k.b }}</div>
							</div>
						</button>
					</div>
				</section>

				<nav class="pager">
					<RouterLink v-if="prev" :to="`/ch/${prev.id}`" class="pg card"><small class="muted">上一章 {{ prev.no }}</small><b>{{ prev.title }}</b></RouterLink>
					<span v-else />
					<RouterLink v-if="next" :to="`/ch/${next.id}`" class="pg card r"><small class="muted">下一章 {{ next.no }}</small><b>{{ next.title }}</b></RouterLink>
				</nav>
			</div>
		</div>
	</main>
</template>

<style scoped>
.backlink {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 14px;
	font-weight: 700;
}

.head {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 24px;
	align-items: end;
	margin: 14px 0 28px;
}

.acts {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 20px;
}

.meter {
	display: flex;
	align-items: center;
	gap: 18px;
	padding: 18px 22px;
}

.meter p {
	margin: 0;
}

.small {
	font-size: 14px;
}

.body {
	display: grid;
	grid-template-columns: 220px 1fr;
	gap: 28px;
	align-items: start;
}

.toc {
	position: sticky;
	top: calc(var(--nav-h) + 20px);
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.toc button {
	display: flex;
	gap: 10px;
	text-align: left;
	border: 0;
	background: transparent;
	padding: 8px 10px;
	border-radius: 10px;
	font-size: 14px;
	font-weight: 700;
	color: var(--muted);
	line-height: 1.4;
	border-left: 3px solid transparent;
	transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.toc button .num {
	font-size: 12px;
	opacity: 0.6;
	padding-top: 1px;
}

.toc button.on {
	color: var(--ink);
	background: var(--card);
	border-left-color: var(--volt);
}

.content {
	display: grid;
	gap: 16px;
	min-width: 0;
}

.sec {
	padding: 24px 26px;
	scroll-margin-top: calc(var(--nav-h) + 16px);
}

.sec h2 {
	display: flex;
	align-items: baseline;
	gap: 12px;
	font-size: 21px;
	font-weight: 900;
	margin: 0 0 12px;
}

.sec h2 .num {
	color: var(--volt);
	font-size: 15px;
}

.sec ul {
	margin: 0;
	padding-left: 1.1em;
	display: grid;
	gap: 8px;
}

.sec li::marker {
	color: var(--muted);
}

.formulas .f {
	display: grid;
	gap: 4px;
	padding: 12px 0;
	border-top: 1px dashed var(--line);
}

.formulas code {
	font-family: var(--mono);
	font-size: 14px;
	background: var(--bg-2);
	padding: 8px 12px;
	border-radius: 10px;
	overflow-x: auto;
	white-space: pre-wrap;
}

.deck {
	margin-top: 12px;
}

.deck small {
	font-size: 13px;
	font-weight: 400;
}

.mini-cards {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 12px;
}

.mc {
	border: 0;
	padding: 0;
	background: transparent;
	perspective: 900px;
	min-height: 150px;
	text-align: left;
}

.inner {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 150px;
	transform-style: preserve-3d;
}

.face {
	position: absolute;
	inset: 0;
	padding: 16px;
	border-radius: 16px;
	border: 1px solid var(--line);
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-weight: 700;
	font-size: 15px;
	line-height: 1.5;
	overflow: auto;
}

.front {
	background: var(--card);
}

.back {
	background: var(--ink);
	color: var(--bg);
	transform: rotateY(180deg);
	font-weight: 500;
}

.back .eyebrow {
	color: var(--volt);
}

.pager {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	margin-top: 12px;
}

.pg {
	padding: 14px 18px;
	display: grid;
}

.pg.r {
	text-align: right;
}

@media (max-width: 900px) {
	.body {
		grid-template-columns: 1fr;
	}

	.toc {
		display: none;
	}

	.head {
		grid-template-columns: 1fr;
	}

	.meter {
		justify-self: start;
	}
}

@media (max-width: 520px) {
	.sec {
		padding: 18px;
	}

	.pager {
		grid-template-columns: 1fr;
	}
}
</style>
