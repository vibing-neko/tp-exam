<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { animate, createLayout, stagger } from 'animejs'
import Ring from '../components/Ring.vue'
import Icon from '../components/Icon.vue'
import { chapters, subjects } from '../data/index.js'
import { chapterStats, subjectStats } from '../store.js'
import { reduced } from '../anim.js'

const route = useRoute()
const router = useRouter()
const filter = ref(Number(route.query.s) || 0)
const grid = ref(null)
let layout

const stats = computed(() => Object.fromEntries(chapters.map(c => [c.id, chapterStats(c.id)])))
const sum = computed(() => ({ 1: subjectStats(1), 2: subjectStats(2) }))

const groups = [
	{ key: 'c1', subject: 1, label: '官方參考資料', ids: c => c.subject === 1 && c.id.startsWith('c') },
	{ key: 't1', subject: 1, label: '《電力市場訓練教材》', ids: c => c.id.startsWith('t') },
	{ key: 'c2', subject: 2, label: '管理規範及作業程序 v05', ids: c => c.subject === 2 }
]

async function setFilter(v) {
	if (v === filter.value) return
	layout?.record()
	filter.value = v
	router.replace({ query: v ? { s: v } : {} })
	await nextTick()
	if (!reduced) layout?.animate({ duration: 650, ease: 'outExpo', delay: stagger(18) })
}

onMounted(() => {
	layout = createLayout(grid.value, {
		children: '.ch-card, .group-title',
		enterFrom: { opacity: 0, transform: 'scale(.92)' },
		leaveTo: { opacity: 0, transform: 'scale(.92)' }
	})
	if (!reduced) {
		animate(grid.value.querySelectorAll('.ch-card:not([style*="none"])'), {
			opacity: [0, 1],
			translateY: [24, 0],
			delay: stagger(40),
			duration: 800,
			ease: 'outExpo',
			onComplete: a => a.revert()
		})
	}
})
onBeforeUnmount(() => layout?.revert())
</script>

<template>
	<main class="page wrap">
		<p class="eyebrow">Study Map</p>
		<h1 class="h1">學習地圖</h1>
		<p class="lead">19 章依考試科目排列。進度環代表熟練度：每題答對一次升一級，答錯歸零，連續答對 4 次算熟練。</p>

		<div class="summary">
			<div v-for="s in subjects" :key="s.id" class="sum card">
				<Ring :value="sum[s.id].mastery" :size="58" :stroke="6" :color="`var(--${s.cls})`" />
				<div>
					<b>{{ s.name }}・{{ s.title }}</b>
					<p class="muted small">已練 {{ sum[s.id].seen }}/{{ sum[s.id].n }} 題 · 正確率 {{ Math.round(sum[s.id].acc * 100) }}%</p>
				</div>
			</div>
		</div>

		<div class="seg filter">
			<button :class="{ on: filter === 0 }" @click="setFilter(0)">全部</button>
			<button :class="{ on: filter === 1 }" @click="setFilter(1)">科目一</button>
			<button :class="{ on: filter === 2 }" @click="setFilter(2)">科目二</button>
		</div>

		<div ref="grid" class="grid-map">
			<template v-for="g in groups" :key="g.key">
				<h2 v-show="!filter || filter === g.subject" class="group-title">
					<span class="chip" :class="subjects[g.subject].cls">{{ subjects[g.subject].name }}</span>{{ g.label }}
				</h2>
				<article v-for="c in chapters.filter(g.ids)" v-show="!filter || filter === c.subject" :key="c.id" class="ch-card card">
					<RouterLink :to="`/ch/${c.id}`" class="ch-link">
						<div class="ch-top">
							<span class="no num" :class="subjects[c.subject].cls">{{ c.no }}</span>
							<Ring :value="stats[c.id].mastery" :size="46" :stroke="5" :color="`var(--${subjects[c.subject].cls})`" />
						</div>
						<h3>{{ c.title }}</h3>
						<p class="muted small">{{ c.brief }}</p>
					</RouterLink>
					<div class="ch-foot">
						<span class="small muted">{{ stats[c.id].seen }}/{{ stats[c.id].n }} 題 · {{ c.cards.length }} 卡</span>
						<RouterLink :to="`/practice?ch=${c.id}`" class="mini">練這章<Icon name="arrow" :size="16" /></RouterLink>
					</div>
				</article>
			</template>
		</div>
	</main>
</template>

<style scoped>
.summary {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	margin: 24px 0 20px;
}

.sum {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 14px 18px;
}

.sum p {
	margin: 0;
}

.small {
	font-size: 13px;
}

.filter {
	margin-bottom: 18px;
}

.grid-map {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 14px;
}

.group-title {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 16px;
	font-weight: 900;
	margin: 18px 0 0;
}

.ch-card {
	display: flex;
	flex-direction: column;
	transition: border-color 0.2s;
}

.ch-card:hover {
	border-color: var(--ink);
}

.ch-link {
	flex: 1;
	padding: 18px 18px 8px;
}

.ch-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.no {
	font-size: 28px;
	font-weight: 700;
	color: var(--s1);
}

.no.s2 {
	color: var(--s2);
}

.ch-card h3 {
	font-size: 18px;
	font-weight: 900;
	margin: 10px 0 6px;
	line-height: 1.35;
}

.ch-card p {
	margin: 0;
}

.ch-foot {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 18px 14px;
	border-top: 1px dashed var(--line);
}

.mini {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 13px;
	font-weight: 700;
	padding: 4px 10px;
	border-radius: 99px;
	background: var(--bg-2);
}

.mini:hover {
	background: var(--volt);
	color: #13161c;
}

@media (max-width: 900px) {
	.grid-map {
		grid-template-columns: 1fr 1fr;
	}
}

@media (max-width: 600px) {
	.grid-map,
	.summary {
		grid-template-columns: 1fr;
	}
}
</style>
