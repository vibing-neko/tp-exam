<script setup>
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { animate, createTimer, utils, stagger } from 'animejs'
import Icon from '../components/Icon.vue'
import { questions, subjects, chapterMap } from '../data/index.js'
import { judge } from '../data/exam.js'
import { answer, saveExam, state } from '../store.js'
import { countUp, reduced } from '../anim.js'

const presets = [
	{ k: 'full', t: '雙科全真模擬', d: '科目一 60 分鐘 → 科目二 90 分鐘，依 40%／60% 加權判定', parts: [{ s: 1, n: 50, m: 60 }, { s: 2, n: 50, m: 90 }] },
	{ k: 's1', t: '科目一', d: '電力系統與電力市場 · 50 題 · 60 分鐘', parts: [{ s: 1, n: 50, m: 60 }] },
	{ k: 's2', t: '科目二', d: '電力交易平台市場規則 · 50 題 · 90 分鐘', parts: [{ s: 2, n: 50, m: 90 }] },
	{ k: 'quick', t: '快速小考', d: '兩科各 10 題 · 共 20 分鐘', parts: [{ s: 1, n: 10, m: 8 }, { s: 2, n: 10, m: 12 }] }
]

const phase = ref('setup')
const preset = ref(presets[0])
const parts = ref([])
const pi = ref(0)
const qi = ref(0)
const remain = ref(0)
const confirm = ref(false)
const scores = ref([])
const verdict = ref(null)
const resultEl = ref(null)
let timer = null

const part = computed(() => parts.value[pi.value])
const q = computed(() => part.value?.qs[qi.value])
const answered = computed(() => part.value ? part.value.ans.filter(a => a >= 0).length : 0)
const mmss = computed(() => {
	const s = Math.max(0, Math.ceil(remain.value / 1000))
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})
const urgent = computed(() => remain.value < 5 * 60000)
const letters = ['A', 'B', 'C', 'D']

function build(p) {
	const pool = utils.shuffle(questions.filter(x => x.subject === p.s)).slice(0, p.n)
	return {
		...p,
		qs: pool,
		order: pool.map(() => utils.shuffle([0, 1, 2, 3])),
		ans: pool.map(() => -1),
		flag: pool.map(() => false)
	}
}

function start() {
	parts.value = preset.value.parts.map(build)
	pi.value = 0
	scores.value = []
	verdict.value = null
	phase.value = 'run'
	runPart()
}

function runPart() {
	qi.value = 0
	// 以實際時鐘計時：anime 引擎在分頁隱藏時會暫停，不能直接拿 timer 進度當剩餘時間
	const endAt = Date.now() + part.value.m * 60000
	remain.value = endAt - Date.now()
	timer?.revert()
	timer = createTimer({
		duration: 250,
		loop: true,
		onLoop: () => {
			remain.value = endAt - Date.now()
			if (remain.value <= 0) submitPart()
		}
	})
	intro()
}

async function intro() {
	await nextTick()
	if (reduced) return
	animate('.ex-q .stem, .ex-q .opt', { opacity: [0, 1], translateY: [10, 0], delay: stagger(40), duration: 450, ease: 'outExpo', onComplete: a => a.revert() })
}

function go(i) {
	qi.value = Math.max(0, Math.min(part.value.qs.length - 1, i))
	intro()
}

function choose(slot) {
	part.value.ans[qi.value] = slot
}

function submitPart() {
	confirm.value = false
	timer?.pause()
	const p = part.value
	let ok = 0
	p.qs.forEach((x, i) => {
		const r = p.ans[i] >= 0 && p.order[i][p.ans[i]] === 0
		if (r) ok++
		if (p.ans[i] >= 0) answer(x.id, r)
	})
	scores.value.push({ s: p.s, ok, n: p.n, score: Math.round((ok / p.n) * 10000) / 100 })
	if (pi.value < parts.value.length - 1) {
		pi.value++
		phase.value = 'break'
	} else {
		finish()
	}
}

async function finish() {
	timer?.revert()
	const a = scores.value.find(x => x.s === 1)
	const b = scores.value.find(x => x.s === 2)
	if (a && b) verdict.value = judge(a.score, b.score)
	else {
		const x = a || b
		verdict.value = { total: x.score, pass: x.score >= 60, reason: x.score >= 60 ? '' : '單科低於 60 分' }
	}
	saveExam({ at: Date.now(), label: preset.value.t, score: verdict.value.total, pass: verdict.value.pass })
	phase.value = 'result'
	await nextTick()
	const el = resultEl.value
	el.querySelectorAll('[data-score]').forEach(n => countUp(n, Number(n.dataset.score), { decimals: 2 }))
	if (!reduced) {
		animate(el.querySelector('.stamp'), { scale: [2.4, 1], rotate: [-24, -8], opacity: [0, 1], delay: 900, duration: 700, ease: 'outBack(1.6)' })
		animate(el.querySelectorAll('.rv'), { opacity: [0, 1], translateY: [12, 0], delay: stagger(30, { start: 600 }), duration: 500, ease: 'outExpo' })
	}
}

function quit() {
	timer?.revert()
	phase.value = 'setup'
}

onBeforeUnmount(() => timer?.revert())
</script>

<template>
	<main class="page wrap">
		<template v-if="phase === 'setup'">
			<p class="eyebrow">Mock Exam</p>
			<h1 class="h1">模擬考</h1>
			<p class="lead">比照簡章：單選題、各科 100 分、總分 = 科一 × 40% + 科二 × 60%，總分 70 以上且單科不低於 60 才及格。題數為本站模擬設定，實際以試卷為準。</p>
			<div class="presets">
				<button v-for="p in presets" :key="p.k" class="pre card" :class="{ on: preset.k === p.k }" @click="preset = p">
					<b>{{ p.t }}</b>
					<small class="muted">{{ p.d }}</small>
					<span class="tags">
						<span v-for="x in p.parts" :key="x.s" class="chip" :class="subjects[x.s].cls">{{ subjects[x.s].name }} {{ x.n }} 題 / {{ x.m }} 分</span>
					</span>
				</button>
			</div>
			<button class="btn volt big" @click="start"><Icon name="clock" />開始計時作答</button>
			<div v-if="state.exams.length" class="history">
				<p class="eyebrow">最近紀錄</p>
				<div v-for="(h, i) in state.exams.slice(0, 6)" :key="i" class="hrow">
					<span>{{ h.label }}</span>
					<span class="muted small">{{ new Date(h.at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
					<b class="num">{{ h.score }}</b>
					<span class="pill" :class="h.pass ? 'ok' : 'no'">{{ h.pass ? '及格' : '未及格' }}</span>
				</div>
			</div>
		</template>

		<template v-else-if="phase === 'run'">
			<div class="exbar card">
				<span class="chip" :class="subjects[part.s].cls">{{ subjects[part.s].name }} {{ subjects[part.s].title }}</span>
				<span class="muted small">已作答 {{ answered }}/{{ part.qs.length }}</span>
				<span class="timer num" :class="{ urgent }"><Icon name="clock" :size="18" />{{ mmss }}</span>
				<button class="btn primary sm" @click="confirm = true">交卷</button>
			</div>

			<div class="exgrid">
				<section class="ex-q card">
					<div class="qhead">
						<span class="num big-n">{{ qi + 1 }}</span>
						<span class="muted small">/ {{ part.qs.length }}</span>
						<button class="flag" :class="{ on: part.flag[qi] }" @click="part.flag[qi] = !part.flag[qi]">
							<Icon name="star" :size="18" />{{ part.flag[qi] ? '已標記' : '標記' }}
						</button>
					</div>
					<h2 class="stem">{{ q.q }}</h2>
					<div class="opts">
						<button v-for="(o, slot) in part.order[qi]" :key="q.id + slot" class="opt" :class="{ on: part.ans[qi] === slot }" @click="choose(slot)">
							<span class="l mono">{{ letters[slot] }}</span><span>{{ q.o[o] }}</span>
						</button>
					</div>
					<div class="nav">
						<button class="btn" :disabled="qi === 0" @click="go(qi - 1)"><Icon name="back" :size="18" />上一題</button>
						<button v-if="qi < part.qs.length - 1" class="btn primary" @click="go(qi + 1)">下一題<Icon name="arrow" :size="18" /></button>
						<button v-else class="btn volt" @click="confirm = true">交卷</button>
					</div>
				</section>
				<aside class="navgrid card">
					<p class="eyebrow">題號</p>
					<div class="nums">
						<button v-for="(x, i) in part.qs" :key="i" class="n num"
							:class="{ cur: i === qi, done: part.ans[i] >= 0, fl: part.flag[i] }" @click="go(i)">{{ i + 1 }}</button>
					</div>
					<p class="legend muted small"><i class="lg done" />已答 <i class="lg fl" />標記</p>
				</aside>
			</div>

			<div v-if="confirm" class="modal" @click.self="confirm = false">
				<div class="dlg card">
					<h3>確定交卷？</h3>
					<p class="muted">還有 {{ part.qs.length - answered }} 題未作答{{ part.flag.filter(Boolean).length ? `，${part.flag.filter(Boolean).length} 題標記待確認` : '' }}。</p>
					<div class="dlg-acts">
						<button class="btn" @click="confirm = false">繼續作答</button>
						<button class="btn primary" @click="submitPart()">交卷</button>
					</div>
				</div>
			</div>
		</template>

		<template v-else-if="phase === 'break'">
			<div class="breaker card">
				<p class="eyebrow">第一節結束</p>
				<h1 class="h1">科目一：<span class="num">{{ scores[0].score }}</span> 分</h1>
				<p class="lead">實際考場兩節之間有 30 分鐘休息。準備好就開始第二節：{{ subjects[part.s].title }}，{{ part.m }} 分鐘。</p>
				<div class="dlg-acts">
					<button class="btn" @click="quit">放棄</button>
					<button class="btn volt" @click="phase = 'run'; runPart()">開始第二節</button>
				</div>
			</div>
		</template>

		<template v-else>
			<div ref="resultEl">
				<div class="score card">
					<div class="parts">
						<div v-for="s in scores" :key="s.s" class="pt">
							<span class="chip" :class="subjects[s.s].cls">{{ subjects[s.s].name }}</span>
							<b class="num" :data-score="s.score">0</b>
							<small class="muted">{{ s.ok }}/{{ s.n }} 題答對</small>
						</div>
						<div v-if="scores.length > 1" class="pt total">
							<span class="chip">加權總分</span>
							<b class="num" :data-score="verdict.total">0</b>
							<small class="muted">科一×40% + 科二×60%</small>
						</div>
					</div>
					<div class="stamp" :class="verdict.pass ? 'ok' : 'no'">{{ verdict.pass ? '及格' : '未及格' }}<small v-if="!verdict.pass">{{ verdict.reason }}</small></div>
				</div>
				<div class="acts">
					<button class="btn volt" @click="start"><Icon name="reset" :size="18" />再考一次</button>
					<RouterLink to="/review" class="btn">去錯題本</RouterLink>
					<button class="btn ghost" @click="phase = 'setup'">回模擬考首頁</button>
				</div>
				<h2 class="h2 rv-title">答錯與未作答</h2>
				<template v-for="p in parts" :key="p.s">
					<div v-for="(x, i) in p.qs" v-show="!(p.ans[i] >= 0 && p.order[i][p.ans[i]] === 0)" :key="x.id" class="rv card">
						<div class="rv-top">
							<span class="chip" :class="subjects[x.subject].cls">{{ chapterMap[x.ch].no }}</span>
							<span class="muted small">{{ p.ans[i] >= 0 ? `你選：${x.o[p.order[i][p.ans[i]]]}` : '未作答' }}</span>
						</div>
						<b>{{ x.q }}</b>
						<p class="ans">正解：{{ x.o[0] }}</p>
						<p class="muted small">{{ x.e }}</p>
					</div>
				</template>
			</div>
		</template>
	</main>
</template>

<style scoped>
.presets {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin: 26px 0 18px;
}

.pre {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	padding: 18px;
	text-align: left;
}

.pre b {
	font-size: 18px;
}

.pre.on {
	border-color: var(--ink);
	box-shadow: inset 0 0 0 1px var(--ink), var(--shadow);
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 4px;
}

.big {
	min-height: 54px;
	padding: 0 28px;
	font-size: 17px;
}

.history {
	margin-top: 32px;
	max-width: 620px;
}

.hrow {
	display: grid;
	grid-template-columns: 1fr auto auto auto;
	gap: 14px;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px solid var(--line);
}

.small {
	font-size: 13px;
}

.pill {
	font-size: 12px;
	font-weight: 700;
	padding: 2px 10px;
	border-radius: 99px;
}

.pill.ok {
	background: var(--ok-soft);
	color: var(--ok);
}

.pill.no {
	background: var(--bad-soft);
	color: var(--bad);
}

.exbar {
	position: sticky;
	top: calc(var(--nav-h) + 8px);
	z-index: 20;
	display: flex;
	align-items: center;
	gap: 14px;
	flex-wrap: wrap;
	padding: 10px 14px;
	margin-bottom: 14px;
}

.timer {
	margin-left: auto;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 22px;
	font-weight: 700;
}

.timer.urgent {
	color: var(--bad);
	animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
	50% {
		opacity: 0.5;
	}
}

.sm {
	min-height: 36px;
	padding: 0 16px;
}

.exgrid {
	display: grid;
	grid-template-columns: 1fr 260px;
	gap: 14px;
	align-items: start;
}

.ex-q {
	padding: 24px;
}

.qhead {
	display: flex;
	align-items: baseline;
	gap: 6px;
}

.big-n {
	font-size: 34px;
	font-weight: 700;
}

.flag {
	margin-left: auto;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	border: 1px solid var(--line);
	background: transparent;
	border-radius: 99px;
	padding: 4px 12px;
	font-size: 13px;
	font-weight: 700;
	color: var(--muted);
}

.flag.on {
	color: #13161c;
	background: var(--volt);
	border-color: var(--volt);
}

.stem {
	font-size: clamp(19px, 2.4vw, 22px);
	font-weight: 900;
	line-height: 1.5;
	margin: 10px 0 18px;
}

.opts {
	display: grid;
	gap: 10px;
}

.opt {
	display: grid;
	grid-template-columns: 34px 1fr;
	gap: 12px;
	align-items: center;
	text-align: left;
	padding: 13px 16px;
	border-radius: 14px;
	border: 1.5px solid var(--line);
	background: var(--bg);
	font-size: 16px;
	line-height: 1.5;
	transition: border-color 0.15s, background 0.15s;
}

.opt:hover {
	border-color: var(--ink);
}

.opt.on {
	border-color: var(--ink);
	background: var(--card);
	box-shadow: inset 0 0 0 1px var(--ink);
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

.opt.on .l {
	background: var(--ink);
	color: var(--bg);
}

.nav {
	display: flex;
	justify-content: space-between;
	margin-top: 20px;
}

.navgrid {
	position: sticky;
	top: calc(var(--nav-h) + 80px);
	padding: 16px;
}

.nums {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 6px;
}

.n {
	aspect-ratio: 1;
	border-radius: 10px;
	border: 1px solid var(--line);
	background: var(--bg);
	font-size: 13px;
	font-weight: 700;
	position: relative;
}

.n.done {
	background: var(--ink);
	color: var(--bg);
	border-color: var(--ink);
}

.n.fl::after,
.lg.fl {
	content: '';
	position: absolute;
	top: 3px;
	right: 3px;
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: var(--volt);
}

.n.cur {
	outline: 2px solid var(--volt);
	outline-offset: 2px;
}

.legend {
	display: flex;
	align-items: center;
	gap: 6px;
	margin: 12px 0 0;
}

.lg {
	display: inline-block;
	width: 12px;
	height: 12px;
	border-radius: 4px;
	position: relative;
}

.lg.done {
	background: var(--ink);
}

.lg.fl {
	position: static;
	border-radius: 50%;
	margin-left: 8px;
}

.modal {
	position: fixed;
	inset: 0;
	z-index: 90;
	background: rgba(0, 0, 0, 0.45);
	display: grid;
	place-items: center;
	padding: 16px;
}

.dlg {
	width: min(420px, 100%);
	padding: 24px;
}

.dlg h3 {
	margin: 0 0 6px;
	font-size: 22px;
}

.dlg-acts {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 18px;
}

.breaker {
	max-width: 640px;
	margin: 40px auto;
	padding: 32px;
}

.score {
	position: relative;
	padding: 32px;
	overflow: hidden;
}

.parts {
	display: flex;
	flex-wrap: wrap;
	gap: 36px;
}

.pt {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.pt b {
	font-size: 56px;
	line-height: 1;
	font-weight: 700;
	margin-top: 6px;
}

.pt.total b {
	color: var(--volt);
}

.stamp {
	position: absolute;
	right: 32px;
	top: 50%;
	margin-top: -52px;
	width: 130px;
	height: 104px;
	display: grid;
	place-items: center;
	align-content: center;
	border: 4px solid currentColor;
	border-radius: 18px;
	font-size: 30px;
	font-weight: 900;
	letter-spacing: 0.1em;
	transform: rotate(-8deg);
}

.stamp small {
	font-size: 11px;
	letter-spacing: 0;
	font-weight: 700;
}

.stamp.ok {
	color: var(--ok);
}

.stamp.no {
	color: var(--bad);
}

.acts {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin: 16px 0 30px;
}

.rv-title {
	margin-top: 10px;
}

.rv {
	padding: 16px 18px;
	margin-bottom: 10px;
}

.rv-top {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 6px;
}

.rv p {
	margin: 6px 0 0;
}

.ans {
	color: var(--ok);
	font-weight: 700;
}

@media (max-width: 860px) {
	.exgrid {
		grid-template-columns: 1fr;
	}

	.navgrid {
		position: static;
	}

	.nums {
		grid-template-columns: repeat(10, 1fr);
	}

	.presets {
		grid-template-columns: 1fr;
	}

	.stamp {
		position: static;
		margin: 24px 0 0;
	}
}

@media (max-width: 520px) {
	.nums {
		grid-template-columns: repeat(6, 1fr);
	}

	.ex-q,
	.score {
		padding: 18px;
	}

	.pt b {
		font-size: 44px;
	}
}
</style>
