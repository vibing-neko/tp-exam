<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { createScope } from 'animejs'
import AnimNum from '../components/AnimNum.vue'
import { formulas, subjects, chapterMap } from '../data/index.js'
import { judge } from '../data/exam.js'
import { reveal } from '../anim.js'

const root = ref(null)
let scope

// 1. 及格判定
const p1 = ref(65)
const p2 = ref(72)
const pass = computed(() => judge(p1.value, p2.value))

// 2. 保證金與月參與費（附件四）
const deposit = { 調頻備轉: 197100, 'E-dReg': 197100, 即時備轉: 153300, 補充備轉: 109500 }
const prod = ref('即時備轉')
const mw = ref(5)
const res = ref(3)
const depositSum = computed(() => Math.round(deposit[prod.value] * Math.round(mw.value * 10) / 10))
const monthFee = computed(() => 8847 + 400 * mw.value + 100 * res.value)

// 3. 每小時價金（附件十一）
const kinds = {
	dReg: { cap: 600, perf: 350, q: 'reg' },
	sReg: { cap: 600, perf: 275, q: 'reg' },
	'即時備轉（1 級）': { cap: 400, perf: 100, q: 'res' },
	'即時備轉（2 級）': { cap: 400, perf: 60, q: 'res' },
	'即時備轉（3 級）': { cap: 400, perf: 40, q: 'res' },
	補充備轉: { cap: 350, perf: 0, q: 'res' }
}
const kind = ref('dReg')
const price = ref(450)
const win = ref(5)
const rate = ref(96)
const qi = computed(() => {
	const r = rate.value
	if (kinds[kind.value].q === 'reg') {
		if (r >= 95) return 1
		if (r > 90) return [0.2, 0.4, 0.6, 0.8][r - 91] ?? 0
		if (r >= 70) return 0
		return -1
	}
	if (r >= 95) return 1
	if (r >= 85) return 0.7
	if (r >= 70) return 0
	return -1
})
const clamped = computed(() => Math.min(price.value, kinds[kind.value].cap))
const hourPay = computed(() => (clamped.value * win.value + kinds[kind.value].perf * win.value) * qi.value)

// 4. 淨尖峰能力（114.05.19 計算原則）
const npk = { dReg: 0.125, sReg: 0.125, 'E-dReg': 0.625, 即時備轉: 0.25, 補充備轉: 0.5 }
const nk = ref('E-dReg')
const ncap = ref(100)
const nrate = ref(100)
const npeak = computed(() => ncap.value * Math.min(nrate.value, 100) / 100 * npk[nk.value])

// 5. 備用 / 備轉容量率
const supply = ref(46000)
const peak = ref(40000)
const margin = computed(() => ((supply.value - peak.value) / peak.value) * 100)

const groups = computed(() => [1, 2].map(s => ({ s, list: formulas.filter(f => f.subject === s) })))

onMounted(() => {
	scope = createScope({ root: root.value }).add(() => reveal(root.value))
})
onBeforeUnmount(() => scope?.revert())
</script>

<template>
	<main ref="root" class="page wrap">
		<p class="eyebrow">Formula Lab</p>
		<h1 class="h1">公式與計算實驗室</h1>
		<p class="lead">考場只能用簡易計算機，這些試算器讓你先把公式的邏輯玩熟。數值依管理規範 v05 附件四、附件十一與淨尖峰能力計算原則。</p>

		<div class="labs">
			<section class="lab card" data-reveal="0">
				<p class="eyebrow">及格判定 · 簡章</p>
				<h2>科一 × 40% + 科二 × 60%</h2>
				<label>科目一 <b class="num">{{ p1 }}</b><input v-model.number="p1" type="range" min="0" max="100" /></label>
				<label>科目二 <b class="num">{{ p2 }}</b><input v-model.number="p2" type="range" min="0" max="100" /></label>
				<div class="out">
					<span>總分</span><b class="big"><AnimNum :value="pass.total" :decimals="2" /></b>
					<span class="verdict" :class="pass.pass ? 'ok' : 'no'">{{ pass.pass ? '及格' : pass.reason }}</span>
				</div>
			</section>

			<section class="lab card" data-reveal="1">
				<p class="eyebrow">保證金與參與費 · 附件四</p>
				<h2>日前輔助服務市場</h2>
				<label>交易商品
					<select v-model="prod"><option v-for="(v, k) in deposit" :key="k">{{ k }}</option></select>
				</label>
				<label>參與容量 <b class="num">{{ mw }} MW</b><input v-model.number="mw" type="range" min="1" max="50" step="0.1" /></label>
				<label>交易資源個數 <b class="num">{{ res }}</b><input v-model.number="res" type="range" min="1" max="30" /></label>
				<div class="out col">
					<span>保證金 = {{ deposit[prod].toLocaleString() }} × {{ mw }}</span>
					<b class="big">NT$ <AnimNum :value="depositSum" /></b>
					<span>每月參與費 = 8,847 + 400 × {{ mw }} + 100 × {{ res }}</span>
					<b class="mid">NT$ <AnimNum :value="monthFee" /></b>
				</div>
			</section>

			<section class="lab card" data-reveal="2">
				<p class="eyebrow">每小時價金 · 附件十一</p>
				<h2>(容量費 + 效能費) × 服務品質指標</h2>
				<label>商品
					<select v-model="kind"><option v-for="(v, k) in kinds" :key="k">{{ k }}</option></select>
				</label>
				<label>結清價格 <b class="num">{{ price }} 元/MW·h</b><input v-model.number="price" type="range" min="0" max="600" step="5" /></label>
				<label>得標容量 <b class="num">{{ win }} MW</b><input v-model.number="win" type="range" min="1" max="30" step="0.1" /></label>
				<label>{{ kinds[kind].q === 'reg' ? '每小時執行率' : '平均待命率' }} <b class="num">{{ rate }}%</b><input v-model.number="rate" type="range" min="50" max="100" /></label>
				<div class="out col">
					<span>
						容量價格上限 {{ kinds[kind].cap }}<template v-if="price > kinds[kind].cap">（已截至上限）</template> ·
						效能價格 {{ kinds[kind].perf }} · 指標 <b>{{ qi }}</b>
					</span>
					<b class="big" :class="{ neg: hourPay < 0 }">NT$ <AnimNum :value="hourPay" :decimals="1" /></b>
				</div>
			</section>

			<section class="lab card" data-reveal="3">
				<p class="eyebrow">淨尖峰能力 · 備用容量</p>
				<h2>容量 × 執行率 × 等效 4hr 係數</h2>
				<label>商品
					<select v-model="nk"><option v-for="(v, k) in npk" :key="k" :value="k">{{ k }}（{{ v }}）</option></select>
				</label>
				<label>平均註冊容量 <b class="num">{{ ncap }} MW</b><input v-model.number="ncap" type="range" min="1" max="200" /></label>
				<label>前一年度平均執行率 <b class="num">{{ nrate }}%</b><input v-model.number="nrate" type="range" min="0" max="130" /></label>
				<div class="out col">
					<span>執行率超過 100% 以 100% 計</span>
					<b class="big"><AnimNum :value="npeak" :decimals="2" /> MW</b>
				</div>
			</section>

			<section class="lab card" data-reveal="4">
				<p class="eyebrow">備用容量率 · 台灣電力系統概論</p>
				<h2>(淨尖峰能力 − 尖峰負載) ÷ 尖峰負載</h2>
				<label>系統規劃淨尖峰能力 <b class="num">{{ supply.toLocaleString() }} MW</b><input v-model.number="supply" type="range" min="35000" max="55000" step="100" /></label>
				<label>系統尖峰負載 <b class="num">{{ peak.toLocaleString() }} MW</b><input v-model.number="peak" type="range" min="30000" max="50000" step="100" /></label>
				<div class="out col">
					<span>換成「運轉淨尖峰能力」與「瞬時尖峰負載」就是備轉容量率</span>
					<b class="big" :class="{ neg: margin < 0 }"><AnimNum :value="margin" :decimals="2" />%</b>
				</div>
			</section>
		</div>

		<h2 class="h2 all-title" data-reveal="0">全部公式</h2>
		<div v-for="g in groups" :key="g.s" class="fgroup">
			<p class="eyebrow">{{ subjects[g.s].name }} · {{ subjects[g.s].title }}</p>
			<div class="flist">
				<div v-for="(f, i) in g.list" :key="i" class="frow card" data-reveal="0">
					<RouterLink :to="`/ch/${f.ch}`" class="chip" :class="subjects[g.s].cls">{{ chapterMap[f.ch].no }}</RouterLink>
					<b>{{ f.name }}</b>
					<code>{{ f.expr }}</code>
					<small v-if="f.note" class="muted">{{ f.note }}</small>
				</div>
			</div>
		</div>
	</main>
</template>

<style scoped>
.labs {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 14px;
	margin-top: 26px;
}

.lab {
	padding: 22px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.lab h2 {
	font-size: 17px;
	font-weight: 900;
	margin: -4px 0 4px;
	font-family: var(--mono);
	letter-spacing: -0.01em;
}

label {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 4px 10px;
	font-size: 14px;
	font-weight: 700;
	color: var(--ink-2);
}

label input,
label select {
	grid-column: 1 / -1;
}

input[type='range'] {
	width: 100%;
	accent-color: var(--volt);
}

select {
	font: inherit;
	padding: 8px 10px;
	border-radius: 10px;
	border: 1px solid var(--line-2);
	background: var(--bg);
	color: var(--ink);
}

.out {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: auto;
	padding-top: 14px;
	border-top: 1px dashed var(--line-2);
	font-size: 13px;
	color: var(--muted);
}

.out.col {
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
}

.big {
	font-size: 34px;
	font-weight: 700;
	color: var(--ink);
	font-family: var(--display);
}

.mid {
	font-size: 22px;
	color: var(--ink);
	font-family: var(--display);
}

.neg {
	color: var(--bad);
}

.verdict {
	padding: 4px 12px;
	border-radius: 99px;
	font-weight: 700;
}

.verdict.ok {
	background: var(--ok-soft);
	color: var(--ok);
}

.verdict.no {
	background: var(--bad-soft);
	color: var(--bad);
}

.all-title {
	margin-top: 48px;
}

.fgroup {
	margin-top: 16px;
}

.flist {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px;
	margin-top: 8px;
}

.frow {
	display: grid;
	gap: 6px;
	padding: 14px 16px;
	align-content: start;
	justify-items: start;
}

.frow code {
	font-family: var(--mono);
	font-size: 13px;
	background: var(--bg-2);
	padding: 6px 10px;
	border-radius: 8px;
	white-space: pre-wrap;
}

@media (max-width: 800px) {
	.labs,
	.flist {
		grid-template-columns: 1fr;
	}
}
</style>
