<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { animate, createTimeline, createTimer, createScope, splitText, stagger, createDrawable, createMotionPath, scrambleText, onScroll, utils } from 'animejs'
import Icon from '../components/Icon.vue'
import Ring from '../components/Ring.vue'
import { subjects, chapters, questions, cards } from '../data/index.js'
import { examStart, judge } from '../data/exam.js'
import { state, statsOf, subjectStats, weakChapters, dueCount, streakDays, todayCount } from '../store.js'
import { reveal, countUp } from '../anim.js'

const root = ref(null)
let scope

const all = computed(() => statsOf(questions))
const s1 = computed(() => subjectStats(1))
const s2 = computed(() => subjectStats(2))
const weak = computed(() => weakChapters(3))
const due = computed(() => dueCount())
const lastExam = computed(() => state.exams[0])

// 以兩科目前正確率估算分數（至少各練 15 題才有參考價值）
const estimate = computed(() => {
	const n1 = questions.filter(q => q.subject === 1 && state.q[q.id]?.s).length
	const n2 = questions.filter(q => q.subject === 2 && state.q[q.id]?.s).length
	if (n1 < 15 || n2 < 15) return null
	const a = Math.round(s1.value.acc * 100)
	const b = Math.round(s2.value.acc * 100)
	return { a, b, ...judge(a, b) }
})

// 倒數
const left = ref({ d: '--', h: '--', m: '--', s: '--', over: false })
function tick() {
	const ms = examStart - Date.now()
	if (ms <= 0) {
		left.value = { d: '00', h: '00', m: '00', s: '00', over: true }
		return
	}
	const p = n => String(n).padStart(2, '0')
	left.value = {
		d: p(Math.floor(ms / 864e5)),
		h: p(Math.floor(ms / 36e5) % 24),
		m: p(Math.floor(ms / 6e4) % 60),
		s: p(Math.floor(ms / 1e3) % 60),
		over: false
	}
}
tick()

// 頻率軌跡：在 dReg 死區內小幅擺動、偶有一次下探
const W = 480
function tracePath() {
	let y = 0
	const pts = []
	for (let x = 0; x <= W * 2; x += 8) {
		const k = x % W
		const dip = k > 250 && k < 330 ? -Math.sin(((k - 250) / 80) * Math.PI) * 26 : 0
		y += (Math.sin(x * 0.7) + Math.cos(x * 0.23)) * 1.6
		y *= 0.82
		pts.push(`${x},${(100 - y - dip).toFixed(1)}`)
	}
	return 'M' + pts.join(' L')
}
const trace = tracePath()
const hz = ref(null)

const steps = [
	{ t: '讀重點', d: '19 章精煉筆記，粗體就是考點', to: '/map', icon: 'book' },
	{ t: '智慧練習', d: '錯題優先、弱章加權、間隔重複', to: '/practice', icon: 'bolt' },
	{ t: '速記卡', d: '拖曳卡片判斷記住了沒', to: '/cards', icon: 'cards' },
	{ t: '模擬考', d: '依簡章計時與 40／60 加權計分', to: '/exam', icon: 'exam' },
	{ t: '錯題本', d: '答錯與收藏自動收進來', to: '/review', icon: 'wrong' }
]

onMounted(() => {
	scope = createScope({ root: root.value }).add(() => {
		const el = root.value
		const title = el.querySelector('.hero-title')
		const { chars } = splitText(title, { chars: { wrap: 'clip' } })

		const tl = createTimeline({ defaults: { ease: 'outExpo' } })
		tl.add(chars, { y: ['110%', '0%'], duration: 1100, delay: stagger(28) })
			.add('.hero [data-in]', { opacity: [0, 1], y: [18, 0], duration: 900, delay: stagger(90) }, '-=850')
			.add(createDrawable('.panel .grid-line'), { draw: ['0 0', '0 1'], duration: 1200, delay: stagger(40) }, '-=900')
			.add(createDrawable('.panel .trace-a'), { draw: ['0 0', '0 1'], duration: 1400 }, '-=1000')
			.add('.panel .node', { scale: [0, 1], duration: 700, delay: stagger(80), ease: 'outBack(2)' }, '-=1100')
			.add('.panel .tick-num', { opacity: [0, 1], duration: 600, delay: stagger(50) }, '-=900')

		// 頻率軌跡持續向左捲動
		animate('.panel .trace-move', { translateX: [0, -W], duration: 9000, ease: 'linear', loop: true })

		// 電力沿著發輸配售流動
		el.querySelectorAll('.flow').forEach((p, i) => {
			animate(el.querySelectorAll(`.pulse-${i}`), {
				...createMotionPath(p),
				duration: 2600,
				delay: stagger(870),
				loop: true,
				ease: 'linear'
			})
		})

		// 頻率讀值：每 1.6 秒以亂碼效果換成新數值
		createTimer({
			duration: 1600,
			loop: true,
			onLoop: () => {
				if (!hz.value) return
				const v = (60 + utils.random(-3, 3) / 100).toFixed(2)
				animate(hz.value, { innerHTML: scrambleText({ text: v, chars: '0-9', cursor: false }), duration: 500 })
			}
		})

		createTimer({ duration: 1000, loop: true, onLoop: tick })

		// 學習路徑的連接線隨捲動畫出
		const path = el.querySelector('.route-line path')
		if (path) {
			animate(createDrawable(path), {
				draw: ['0 0', '0 1'],
				ease: 'linear',
				autoplay: onScroll({ target: el.querySelector('.route'), enter: 'bottom-=100 top', leave: 'center+=100 bottom', sync: 0.3 })
			})
		}

		reveal(el)
	})

	countUp(root.value.querySelector('[data-c="seen"]'), all.value.seen)
	countUp(root.value.querySelector('[data-c="acc"]'), Math.round(all.value.acc * 100), { suffix: '%' })
	countUp(root.value.querySelector('[data-c="mst"]'), all.value.mastered)
	countUp(root.value.querySelector('[data-c="today"]'), todayCount())
})

onBeforeUnmount(() => scope?.revert())
</script>

<template>
	<main ref="root" class="home">
		<section class="hero wrap">
			<div class="copy">
				<p class="eyebrow" data-in>電力交易平台專業人員 · 115 年資格測驗</p>
				<h1 class="hero-title">把電網規則<br>練成直覺</h1>
				<p class="lead" data-in>從台灣電力系統、電力市場到管理規範 v05 的每一個數字。重點筆記、智慧出題、速記卡與仿真模擬考，全部記在你的瀏覽器裡。</p>
				<div class="cta" data-in>
					<RouterLink to="/practice" class="btn volt"><Icon name="bolt" />開始智慧練習</RouterLink>
					<RouterLink to="/exam" class="btn">模擬考<Icon name="arrow" :size="18" /></RouterLink>
				</div>
				<div class="count" data-in>
					<template v-if="!left.over">
						<span class="eyebrow">距離第一節開考 10/03 13:20</span>
						<div class="clock num">
							<b>{{ left.d }}<small>天</small></b>
							<b>{{ left.h }}<small>時</small></b>
							<b>{{ left.m }}<small>分</small></b>
							<b>{{ left.s }}<small>秒</small></b>
						</div>
					</template>
					<span v-else class="eyebrow">115 年測驗已舉行 · 結果 10/20 14:00 起查詢</span>
				</div>
			</div>

			<div class="panel card" aria-hidden="true">
				<div class="panel-head">
					<span class="eyebrow">System Frequency</span>
					<span class="live mono">● LIVE</span>
				</div>
				<div class="readout"><span ref="hz" class="num">60.00</span><small>Hz</small></div>
				<svg class="scope" viewBox="0 0 480 200">
					<g class="tick-num mono">
						<text x="476" y="27" text-anchor="end">60.25 · −100%</text>
						<text x="476" y="77" text-anchor="end">60.02</text>
						<text x="476" y="127" text-anchor="end">59.98</text>
						<text x="476" y="152" text-anchor="end">59.90 sReg</text>
						<text x="476" y="187" text-anchor="end">59.75 · +100%</text>
					</g>
					<rect x="0" y="80" width="480" height="40" class="band" />
					<path class="grid-line" d="M0 30 H480" />
					<path class="grid-line" d="M0 80 H480" />
					<path class="grid-line mid" d="M0 100 H480" />
					<path class="grid-line" d="M0 120 H480" />
					<path class="grid-line warn" d="M0 145 H480" />
					<path class="grid-line" d="M0 190 H480" />
					<g class="trace-move">
						<path class="trace-a" :d="trace" />
					</g>
				</svg>
				<svg class="net" viewBox="0 0 480 120">
					<path class="flow" d="M40 60 C 120 10, 160 10, 200 60" />
					<path class="flow" d="M200 60 C 250 110, 290 110, 330 60" />
					<path class="flow" d="M330 60 C 370 20, 410 20, 440 60" />
					<circle v-for="i in 3" :key="'a' + i" class="pulse pulse-0" r="4" />
					<circle v-for="i in 3" :key="'b' + i" class="pulse pulse-1" r="4" />
					<circle v-for="i in 3" :key="'c' + i" class="pulse pulse-2" r="4" />
					<g v-for="(n, i) in [['發電', 40], ['輸電 345kV', 200], ['配電', 330], ['用戶', 440]]" :key="i">
						<circle class="node" :cx="n[1]" cy="60" r="9" />
						<text class="node-label" :x="n[1]" y="100" text-anchor="middle">{{ n[0] }}</text>
					</g>
				</svg>
			</div>
		</section>

		<section class="wrap stats">
			<div class="tile card" data-reveal="0">
				<span class="eyebrow">已練習</span>
				<b class="num"><span data-c="seen">0</span><small> / {{ questions.length }}</small></b>
				<div class="bar"><i :style="{ width: (all.seen / all.n) * 100 + '%' }" /></div>
			</div>
			<div class="tile card" data-reveal="1">
				<span class="eyebrow">整體正確率</span>
				<b class="num" data-c="acc">0%</b>
				<span class="muted small">累積作答 {{ Object.values(state.q).reduce((a, s) => a + (s.s || 0), 0) }} 次</span>
			</div>
			<div class="tile card" data-reveal="2">
				<span class="eyebrow">已熟練題</span>
				<b class="num" data-c="mst">0</b>
				<span class="muted small">連續答對 4 次以上</span>
			</div>
			<div class="tile card" data-reveal="3">
				<span class="eyebrow">今日作答</span>
				<b class="num" data-c="today">0</b>
				<span class="muted small">連續學習 {{ streakDays() }} 天</span>
			</div>
		</section>

		<section class="wrap smart">
			<div class="todo card" data-reveal="0">
				<p class="eyebrow">今日建議</p>
				<h2 class="h2">{{ due ? `有 ${due} 題到了該複習的時間` : all.seen ? '保持手感，先攻最弱的章節' : '先從一輪智慧練習開始' }}</h2>
				<p class="muted">系統依你的作答紀錄排程：答錯的題目幾分鐘後再出現，答對越多次間隔越長，考前衝刺的間隔已刻意縮短。</p>
				<div class="cta">
					<RouterLink to="/practice" class="btn primary"><Icon name="bolt" />{{ due ? '複習到期題' : '智慧練習 10 題' }}</RouterLink>
					<RouterLink to="/cards" class="btn">翻速記卡（{{ cards.length }} 張）</RouterLink>
				</div>
				<div v-if="estimate" class="est">
					<span class="eyebrow">依目前正確率估算</span>
					<div class="est-row">
						<span>科一 <b class="num">{{ estimate.a }}</b></span>
						<span>科二 <b class="num">{{ estimate.b }}</b></span>
						<span>總分 <b class="num">{{ estimate.total }}</b></span>
						<span class="verdict" :class="estimate.pass ? 'ok' : 'no'">{{ estimate.pass ? '可望及格' : estimate.reason }}</span>
					</div>
				</div>
			</div>
			<div class="weak card" data-reveal="1">
				<p class="eyebrow">最需要加強</p>
				<RouterLink v-for="w in weak" :key="w.c.id" :to="`/ch/${w.c.id}`" class="weak-row">
					<Ring :value="w.st.mastery" :size="48" :stroke="5" :color="`var(--${subjects[w.c.subject].cls})`" />
					<div>
						<span class="chip" :class="subjects[w.c.subject].cls">{{ w.c.no }}</span>
						<b>{{ w.c.title }}</b>
						<small class="muted">已練 {{ w.st.seen }}/{{ w.st.n }} 題</small>
					</div>
					<Icon name="arrow" :size="18" />
				</RouterLink>
				<p v-if="lastExam" class="muted small last">上次模擬考：{{ lastExam.label }} {{ lastExam.score }} 分（{{ new Date(lastExam.at).toLocaleDateString('zh-TW') }}）</p>
			</div>
		</section>

		<section class="wrap subj">
			<RouterLink v-for="s in subjects" :key="s.id" :to="`/map?s=${s.id}`" class="subj-card card" :class="s.cls" data-reveal="0">
				<div class="subj-top">
					<span class="chip" :class="s.cls">{{ s.name }} · 占 {{ s.weight * 100 }}%</span>
					<Ring :value="(s.id === 1 ? s1 : s2).mastery" :size="72" :stroke="7" :color="`var(--${s.cls})`" />
				</div>
				<h3>{{ s.title }}</h3>
				<p class="muted">
					{{ s.minutes }} 分鐘 · {{ chapters.filter(c => c.subject === s.id).length }} 章 ·
					{{ questions.filter(q => q.subject === s.id).length }} 題
				</p>
				<p class="small">{{ s.id === 1 ? '台灣電力系統、運轉調度、市場概述、輔助服務，加上《電力市場訓練教材》九大主題。' : '管理規範 v05 九章 42 條與 13 個附件：參與、商品規格、運作結算、備用容量與最新修正。' }}</p>
			</RouterLink>
		</section>

		<section class="wrap route">
			<p class="eyebrow" data-reveal="0">建議的學習路徑</p>
			<h2 class="h2" data-reveal="1">五步驟，從看懂到考過</h2>
			<div class="route-body">
				<svg class="route-line" viewBox="0 0 10 500" preserveAspectRatio="none" aria-hidden="true"><path d="M5 0 V500" /></svg>
				<RouterLink v-for="(s, i) in steps" :key="i" :to="s.to" class="step" :data-reveal="i">
					<span class="step-ic"><Icon :name="s.icon" /></span>
					<div>
						<b><span class="num muted">{{ String(i + 1).padStart(2, '0') }}</span> {{ s.t }}</b>
						<p class="muted">{{ s.d }}</p>
					</div>
				</RouterLink>
			</div>
		</section>

		<footer class="wrap foot muted small">
			內容整理自台電電力交易平台公開之參考資料、管理規範及作業程序（TPC-MT-v05）與 115 年測驗簡章，僅供個人學習，以台電最新公告為準。
		</footer>
	</main>
</template>

<style scoped>
.home {
	padding-bottom: 120px;
}

.hero {
	display: grid;
	grid-template-columns: 1.05fr 1fr;
	gap: 40px;
	align-items: center;
	padding-top: 56px;
	padding-bottom: 56px;
}

.hero-title {
	font-weight: 900;
	font-size: clamp(44px, 7.4vw, 88px);
	line-height: 1.04;
	letter-spacing: -0.02em;
	margin: 12px 0 20px;
}

.cta {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 26px;
}

.count {
	margin-top: 34px;
}

.clock {
	display: flex;
	gap: 10px;
	margin-top: 8px;
}

.clock b {
	display: flex;
	align-items: baseline;
	gap: 3px;
	font-size: 34px;
	font-weight: 700;
	padding: 4px 12px;
	border-radius: 12px;
	background: var(--card);
	border: 1px solid var(--line);
}

.clock small {
	font-size: 12px;
	color: var(--muted);
	font-family: var(--font);
}

.panel {
	padding: 20px;
	background:
		radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--volt) 14%, transparent), transparent 60%),
		var(--card);
	overflow: hidden;
}

.panel-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.live {
	font-size: 11px;
	color: var(--ok);
	animation: blink 1.6s steps(2) infinite;
}

@keyframes blink {
	50% {
		opacity: 0.35;
	}
}

.readout {
	display: flex;
	align-items: baseline;
	gap: 6px;
	margin: 4px 0 6px;
}

.readout span {
	font-size: 56px;
	font-weight: 700;
	letter-spacing: -0.02em;
}

.readout small {
	font-family: var(--mono);
	color: var(--muted);
}

.scope,
.net {
	display: block;
	width: 100%;
	height: auto;
	overflow: visible;
}

.scope {
	overflow: hidden;
}

.band {
	fill: color-mix(in srgb, var(--teal) 12%, transparent);
}

.grid-line {
	stroke: var(--line-2);
	stroke-width: 1;
	stroke-dasharray: 2 4;
	fill: none;
}

.grid-line.mid {
	stroke: var(--muted);
	stroke-dasharray: none;
	opacity: 0.4;
}

.grid-line.warn {
	stroke: var(--s2);
	opacity: 0.6;
}

.trace-a {
	fill: none;
	stroke: var(--volt);
	stroke-width: 2.4;
	stroke-linejoin: round;
}

.tick-num text {
	font-size: 10px;
	fill: var(--muted);
}

.flow {
	fill: none;
	stroke: var(--line-2);
	stroke-width: 2;
}

.pulse {
	fill: var(--teal);
}

.node {
	fill: var(--card);
	stroke: var(--ink);
	stroke-width: 2.5;
	transform-box: fill-box;
	transform-origin: center;
}

.node-label {
	font-size: 12px;
	font-weight: 700;
	fill: var(--ink-2);
}

.stats {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 14px;
}

.tile {
	padding: 18px 20px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.tile b {
	font-size: 36px;
	line-height: 1.1;
}

.tile b small {
	font-size: 15px;
	color: var(--muted);
}

.small {
	font-size: 13px;
}

.smart {
	display: grid;
	grid-template-columns: 1.4fr 1fr;
	gap: 14px;
	margin-top: 14px;
}

.todo,
.weak {
	padding: 24px;
}

.est {
	margin-top: 20px;
	padding-top: 16px;
	border-top: 1px dashed var(--line-2);
}

.est-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
	margin-top: 6px;
}

.est-row b {
	font-size: 22px;
}

.verdict {
	padding: 4px 12px;
	border-radius: 99px;
	font-weight: 700;
	font-size: 13px;
}

.verdict.ok {
	background: var(--ok-soft);
	color: var(--ok);
}

.verdict.no {
	background: var(--bad-soft);
	color: var(--bad);
}

.weak-row {
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 14px;
	align-items: center;
	padding: 12px 0;
	border-bottom: 1px solid var(--line);
}

.weak-row:last-of-type {
	border-bottom: 0;
}

.weak-row b {
	display: block;
	margin-top: 2px;
}

.last {
	margin: 12px 0 0;
}

.subj {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 14px;
	margin-top: 14px;
}

.subj-card {
	padding: 24px;
	position: relative;
	overflow: hidden;
	transition: border-color 0.25s;
}

.subj-card:hover {
	border-color: var(--ink);
}

.subj-card::after {
	content: '';
	position: absolute;
	right: -40px;
	bottom: -60px;
	width: 200px;
	height: 200px;
	border-radius: 50%;
	background: var(--s1-soft);
	z-index: -1;
}

.subj-card.s2::after {
	background: var(--s2-soft);
}

.subj-card {
	isolation: isolate;
}

.subj-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.subj-card h3 {
	font-size: 24px;
	font-weight: 900;
	margin: 14px 0 4px;
}

.route {
	margin-top: 72px;
}

.route-body {
	position: relative;
	display: grid;
	gap: 12px;
	padding-left: 8px;
	margin-top: 8px;
}

.route-line {
	position: absolute;
	left: 29px;
	top: 20px;
	bottom: 20px;
	width: 10px;
	height: calc(100% - 40px);
}

.route-line path {
	stroke: var(--volt);
	stroke-width: 3;
	fill: none;
	vector-effect: non-scaling-stroke;
}

.step {
	position: relative;
	display: grid;
	grid-template-columns: 52px 1fr;
	gap: 14px;
	align-items: center;
	padding: 14px 18px 14px 0;
	border-radius: 16px;
	transition: background 0.2s;
}

.step:hover {
	background: var(--card);
}

.step-ic {
	width: 52px;
	height: 52px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	background: var(--card);
	border: 2px solid var(--ink);
	position: relative;
	z-index: 1;
}

.step b {
	font-size: 18px;
}

.step p {
	margin: 0;
	font-size: 14px;
}

.foot {
	margin-top: 64px;
	padding-top: 20px;
	border-top: 1px solid var(--line);
}

@media (max-width: 900px) {
	.hero {
		grid-template-columns: 1fr;
		padding-top: 28px;
		gap: 28px;
	}

	.stats {
		grid-template-columns: repeat(2, 1fr);
	}

	.smart,
	.subj {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 420px) {
	.clock b {
		font-size: 26px;
		padding: 4px 8px;
	}

	.tile b {
		font-size: 28px;
	}

	.readout span {
		font-size: 44px;
	}
}
</style>
