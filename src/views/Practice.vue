<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { animate, utils, stagger } from 'animejs'
import QuestionCard from '../components/QuestionCard.vue'
import Ring from '../components/Ring.vue'
import Icon from '../components/Icon.vue'
import { chapters, chapterMap, subjects, questions } from '../data/index.js'
import { answer, pickSmart, dueCount, wrongList, chapterStats } from '../store.js'
import { reduced } from '../anim.js'

const route = useRoute()

const mode = ref(route.query.mode || (route.query.ch ? 'chapter' : 'smart'))
const subject = ref(0)
const chId = ref(route.query.ch || chapters[0].id)
const count = ref(10)

const list = ref([])
const pos = ref(0)
const results = ref([])
const phase = ref('setup')
const combo = ref(0)
const comboEl = ref(null)
const barEl = ref(null)

const cur = computed(() => list.value[pos.value])
const right = computed(() => results.value.filter(r => r.ok).length)

const modes = [
	{ k: 'smart', t: '智慧推薦', d: '錯題與到期題優先、弱章加權' },
	{ k: 'chapter', t: '指定章節', d: '整章依序練習' },
	{ k: 'wrong', t: '錯題重練', d: '答錯或收藏的題目' },
	{ k: 'random', t: '隨機抽題', d: '完全隨機，檢驗手感' }
]

function build() {
	const n = count.value
	if (mode.value === 'smart') return pickSmart({ subject: subject.value, n })
	if (mode.value === 'chapter') return utils.shuffle([...questions.filter(q => q.ch === chId.value)])
	if (mode.value === 'wrong') return utils.shuffle(wrongList().filter(q => !subject.value || q.subject === subject.value)).slice(0, n)
	return utils.shuffle(questions.filter(q => !subject.value || q.subject === subject.value)).slice(0, n)
}

const available = computed(() => {
	if (mode.value === 'chapter') return questions.filter(q => q.ch === chId.value).length
	if (mode.value === 'wrong') return wrongList().filter(q => !subject.value || q.subject === subject.value).length
	return Math.min(count.value, questions.filter(q => !subject.value || q.subject === subject.value).length)
})

function start() {
	list.value = build()
	if (!list.value.length) return
	pos.value = 0
	results.value = []
	combo.value = 0
	phase.value = 'run'
}

function onAnswered(ok) {
	const q = cur.value
	answer(q.id, ok)
	results.value.push({ q, ok })
	combo.value = ok ? combo.value + 1 : 0
	if (ok && combo.value >= 3) {
		nextTick(() => {
			if (comboEl.value && !reduced) animate(comboEl.value, { scale: [1.5, 1], rotate: [-8, 0], duration: 600, ease: 'outElastic(1, .5)' })
		})
	}
	if (barEl.value) animate(barEl.value, { width: `${((pos.value + 1) / list.value.length) * 100}%`, duration: 500, ease: 'outExpo' })
}

async function next() {
	if (pos.value < list.value.length - 1) {
		pos.value++
		return
	}
	phase.value = 'done'
	await nextTick()
	if (!reduced) animate('.res-row', { opacity: [0, 1], translateX: [-12, 0], delay: stagger(30), duration: 500, ease: 'outExpo' })
}

onMounted(() => {
	if (route.query.ch || route.query.go) start()
})
</script>

<template>
	<main class="page wrap narrow">
		<template v-if="phase === 'setup'">
			<p class="eyebrow">Practice</p>
			<h1 class="h1">智慧練習</h1>
			<p class="lead">每題即時看解析。答錯的題目會在幾分鐘後回來找你，答對越多次越晚出現。</p>

			<div class="modes">
				<button v-for="m in modes" :key="m.k" class="mode card" :class="{ on: mode === m.k }" @click="mode = m.k">
					<b>{{ m.t }}</b>
					<small class="muted">{{ m.d }}</small>
					<span v-if="m.k === 'smart' && dueCount()" class="badge num">{{ dueCount() }} 題到期</span>
					<span v-if="m.k === 'wrong'" class="badge num">{{ wrongList().length }} 題</span>
				</button>
			</div>

			<div class="opts card">
				<template v-if="mode === 'chapter'">
					<label class="eyebrow">選擇章節</label>
					<select v-model="chId" class="sel">
						<optgroup v-for="s in subjects" :key="s.id" :label="`${s.name} ${s.title}`">
							<option v-for="c in chapters.filter(c => c.subject === s.id)" :key="c.id" :value="c.id">
								{{ c.no }}　{{ c.title }}（{{ chapterStats(c.id).seen }}/{{ c.questions.length }}）
							</option>
						</optgroup>
					</select>
				</template>
				<template v-else>
					<label class="eyebrow">範圍</label>
					<div class="seg">
						<button :class="{ on: subject === 0 }" @click="subject = 0">兩科</button>
						<button :class="{ on: subject === 1 }" @click="subject = 1">科目一</button>
						<button :class="{ on: subject === 2 }" @click="subject = 2">科目二</button>
					</div>
					<label class="eyebrow">題數</label>
					<div class="seg">
						<button v-for="n in [10, 20, 30, 50]" :key="n" :class="{ on: count === n }" @click="count = n">{{ n }}</button>
					</div>
				</template>
				<button class="btn volt go" :disabled="!available" @click="start">
					<Icon name="bolt" />開始（{{ available }} 題）
				</button>
				<p v-if="!available" class="muted small">目前沒有符合條件的題目，先去做幾題智慧練習吧。</p>
			</div>
		</template>

		<template v-else-if="phase === 'run'">
			<div class="runhead">
				<button class="btn ghost sm" @click="phase = 'setup'"><Icon name="back" :size="18" />結束</button>
				<div class="bar grow"><i ref="barEl" :style="{ background: 'var(--volt)' }" /></div>
				<span class="num">{{ pos + 1 }}/{{ list.length }}</span>
				<span v-if="combo >= 3" ref="comboEl" class="combo num">連對 ×{{ combo }}</span>
			</div>
			<QuestionCard :q="cur" :label="`#${pos + 1}`" @answered="onAnswered" @next="next" />
		</template>

		<template v-else>
			<p class="eyebrow">Result</p>
			<div class="result card">
				<Ring :value="right / list.length" :size="132" :stroke="10" :color="right / list.length >= 0.7 ? 'var(--ok)' : 'var(--bad)'" />
				<div>
					<h1 class="h1">{{ right }} / {{ list.length }}</h1>
					<p class="lead">{{ right / list.length >= 0.9 ? '非常穩，換下一個章節吧。' : right / list.length >= 0.7 ? '過了及格線，錯的那幾題再看一眼解析。' : '先別急，回到章節重點再練一輪。' }}</p>
					<div class="acts">
						<button class="btn volt" @click="start"><Icon name="reset" :size="18" />再來一輪</button>
						<RouterLink to="/review" class="btn">去錯題本</RouterLink>
					</div>
				</div>
			</div>
			<div class="res-list">
				<div v-for="(r, i) in results" :key="i" class="res-row" :class="r.ok ? 'ok' : 'no'">
					<Icon :name="r.ok ? 'check' : 'close'" :size="18" />
					<span>{{ r.q.q }}</span>
					<RouterLink :to="`/ch/${r.q.ch}`" class="chip">{{ chapterMap[r.q.ch].no }}</RouterLink>
				</div>
			</div>
		</template>
	</main>
</template>

<style scoped>
.narrow {
	max-width: 820px;
}

.modes {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 10px;
	margin: 26px 0 14px;
}

.mode {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	padding: 16px;
	text-align: left;
	transition: border-color 0.2s, background 0.2s;
}

.mode.on {
	border-color: var(--ink);
	box-shadow: inset 0 0 0 1px var(--ink), var(--shadow);
}

.mode small {
	font-size: 12px;
	line-height: 1.5;
}

.badge {
	margin-top: 6px;
	font-size: 11px;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 99px;
	background: var(--bad-soft);
	color: var(--bad);
}

.opts {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	padding: 20px;
}

.sel {
	width: 100%;
	font: inherit;
	padding: 12px;
	border-radius: 12px;
	border: 1px solid var(--line-2);
	background: var(--bg);
	color: var(--ink);
}

.go {
	margin-top: 8px;
}

.small {
	font-size: 13px;
}

.runhead {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 14px;
}

.grow {
	flex: 1;
}

.sm {
	min-height: 36px;
	padding: 0 12px;
}

.combo {
	padding: 3px 10px;
	border-radius: 99px;
	background: var(--volt);
	color: #13161c;
	font-weight: 700;
	font-size: 13px;
}

.result {
	display: flex;
	align-items: center;
	gap: 28px;
	padding: 28px;
	margin-top: 8px;
}

.acts {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 16px;
}

.res-list {
	display: grid;
	gap: 6px;
	margin-top: 18px;
}

.res-row {
	display: grid;
	grid-template-columns: 22px 1fr auto;
	gap: 10px;
	align-items: start;
	padding: 10px 14px;
	border-radius: 12px;
	background: var(--card);
	border: 1px solid var(--line);
	font-size: 14px;
}

.res-row.ok svg {
	color: var(--ok);
}

.res-row.no svg {
	color: var(--bad);
}

@media (max-width: 720px) {
	.modes {
		grid-template-columns: 1fr 1fr;
	}

	.result {
		flex-direction: column;
		text-align: center;
	}

	.acts {
		justify-content: center;
	}
}
</style>
