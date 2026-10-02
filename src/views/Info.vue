<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { createScope, animate, createDrawable, stagger, onScroll } from 'animejs'
import Icon from '../components/Icon.vue'
import { timeline, sessions, rules, qualification } from '../data/exam.js'
import { subjects } from '../data/index.js'
import { resetAll } from '../store.js'
import { reveal } from '../anim.js'

const root = ref(null)
const ask = ref(false)
let scope

function doReset() {
	resetAll()
	ask.value = false
}

onMounted(() => {
	scope = createScope({ root: root.value }).add(() => {
		const el = root.value
		animate(createDrawable(el.querySelector('.tl-line path')), {
			draw: ['0 0', '0 1'],
			ease: 'linear',
			autoplay: onScroll({ target: el.querySelector('.tl'), enter: 'bottom-=80 top', leave: 'center bottom', sync: 0.4 })
		})
		animate(el.querySelectorAll('.tl-dot'), {
			scale: [0, 1],
			delay: stagger(140, { start: 300 }),
			duration: 700,
			ease: 'outBack(2)'
		})
		reveal(el)
	})
})
onBeforeUnmount(() => scope?.revert())
</script>

<template>
	<main ref="root" class="page wrap">
		<p class="eyebrow">Exam Guide</p>
		<h1 class="h1">考試資訊</h1>
		<p class="lead">整理自〈電力交易平台專業人員 115 年資格測驗簡章〉（115 年 8 月 12 日公告），主辦單位台灣電力公司，試務由松盟科技辦理。實際規定以報名網站最新公告為準。</p>

		<div class="cols">
			<section class="tl card" data-reveal="0">
				<h2 class="h2">重要日程</h2>
				<div class="tl-body">
					<svg class="tl-line" viewBox="0 0 4 100" preserveAspectRatio="none" aria-hidden="true"><path d="M2 0 V100" /></svg>
					<div v-for="(t, i) in timeline" :key="i" class="tl-item" :class="{ hot: t.hot }">
						<i class="tl-dot" />
						<span class="mono small muted">{{ t.date }}</span>
						<b>{{ t.title }}</b>
						<p class="muted small">{{ t.note }}</p>
					</div>
				</div>
			</section>

			<div class="side">
				<section v-for="(s, i) in sessions" :key="i" class="sess card" :class="subjects[s.subject].cls" :data-reveal="i + 1">
					<div class="sess-top">
						<span class="chip" :class="subjects[s.subject].cls">{{ s.name }} · {{ subjects[s.subject].name }}</span>
						<span class="mono small">預備 {{ s.prep }}</span>
					</div>
					<h3>{{ s.title }}</h3>
					<p class="time num">{{ s.time }}</p>
					<ul class="small">
						<li>測驗 {{ s.minutes }} 分鐘，單選題，2B 鉛筆畫記</li>
						<li>開始後 {{ s.lock }} 分鐘內不得離場</li>
						<li>{{ s.late }}</li>
					</ul>
				</section>

				<section class="score card" data-reveal="3">
					<h2 class="h2">成績計算</h2>
					<div class="formula">
						<span class="pill s1">科目一 × 40%</span>
						<span class="plus">+</span>
						<span class="pill s2">科目二 × 60%</span>
						<span class="plus">≥</span>
						<span class="pill volt num">70</span>
					</div>
					<p class="small">各科以 100 分計、缺考以零分計，成績算至小數第二位（第三位四捨五入）。總成績須達 70 分<b>且任一科不得低於 60 分</b>。</p>
					<RouterLink to="/formulas" class="small link">用試算器玩玩看 →</RouterLink>
				</section>
			</div>
		</div>

		<section class="rules card" data-reveal="0">
			<h2 class="h2">試場規則重點</h2>
			<ol>
				<li v-for="(r, i) in rules" :key="i">{{ r }}</li>
			</ol>
		</section>

		<section class="qual card" data-reveal="0">
			<h2 class="h2">通過之後：取得專業人員資格證明</h2>
			<div class="steps">
				<div v-for="(q, i) in qualification" :key="i" class="qs">
					<span class="num n">{{ i + 1 }}</span>
					<p>{{ q }}</p>
				</div>
			</div>
		</section>

		<section class="data card" data-reveal="0">
			<div>
				<h2 class="h2">學習紀錄</h2>
				<p class="muted small">作答紀錄、速記卡進度與模擬考成績只存在這台裝置的瀏覽器（localStorage），不會上傳。清除瀏覽器資料或換裝置會從頭開始。</p>
			</div>
			<button v-if="!ask" class="btn" @click="ask = true"><Icon name="reset" :size="18" />清除所有學習紀錄</button>
			<div v-else class="confirm">
				<span class="small">確定要清除？此動作無法復原。</span>
				<button class="btn" @click="ask = false">取消</button>
				<button class="btn danger" @click="doReset">確定清除</button>
			</div>
		</section>
	</main>
</template>

<style scoped>
.cols {
	display: grid;
	grid-template-columns: 1fr 1.1fr;
	gap: 14px;
	margin-top: 26px;
	align-items: start;
}

.tl,
.sess,
.score,
.rules,
.qual,
.data {
	padding: 24px;
}

.small {
	font-size: 14px;
}

.tl-body {
	position: relative;
	padding-left: 30px;
}

.tl-line {
	position: absolute;
	left: 7px;
	top: 8px;
	width: 4px;
	height: calc(100% - 16px);
}

.tl-line path {
	stroke: var(--line-2);
	stroke-width: 2;
	fill: none;
	vector-effect: non-scaling-stroke;
}

.tl-item {
	position: relative;
	display: grid;
	padding-bottom: 18px;
}

.tl-item p {
	margin: 0;
}

.tl-dot {
	position: absolute;
	left: -29px;
	top: 6px;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: var(--card);
	border: 3px solid var(--ink);
}

.tl-item.hot .tl-dot {
	background: var(--volt);
	border-color: var(--volt);
	box-shadow: 0 0 0 6px color-mix(in srgb, var(--volt) 25%, transparent);
}

.tl-item.hot b {
	font-size: 20px;
}

.side {
	display: grid;
	gap: 14px;
}

.sess-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.sess h3 {
	font-size: 22px;
	font-weight: 900;
	margin: 12px 0 0;
}

.time {
	font-size: 30px;
	font-weight: 700;
	margin: 0 0 6px;
}

.sess.s1 .time {
	color: var(--s1);
}

.sess.s2 .time {
	color: var(--s2);
}

.sess ul {
	margin: 0;
	padding-left: 1.1em;
}

.formula {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}

.pill {
	padding: 6px 14px;
	border-radius: 99px;
	font-weight: 900;
}

.pill.s1 {
	background: var(--s1-soft);
	color: var(--s1);
}

.pill.s2 {
	background: var(--s2-soft);
	color: var(--s2);
}

.pill.volt {
	background: var(--volt);
	color: #13161c;
	font-size: 18px;
}

.plus {
	font-weight: 900;
	color: var(--muted);
}

.link {
	text-decoration: underline;
	text-underline-offset: 3px;
}

.rules,
.qual,
.data {
	margin-top: 14px;
}

.rules ol {
	margin: 0;
	padding-left: 1.3em;
	display: grid;
	gap: 8px;
}

.steps {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
}

.qs {
	padding: 16px;
	border-radius: 14px;
	background: var(--bg-2);
}

.qs .n {
	display: grid;
	place-items: center;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background: var(--ink);
	color: var(--bg);
	font-weight: 700;
}

.qs p {
	margin: 10px 0 0;
	font-size: 14px;
}

.data {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 18px;
	flex-wrap: wrap;
}

.data > div {
	flex: 1 1 320px;
}

.confirm {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
}

.danger {
	background: var(--bad);
	border-color: var(--bad);
	color: #fff;
}

@media (max-width: 900px) {
	.cols {
		grid-template-columns: 1fr;
	}

	.steps {
		grid-template-columns: 1fr 1fr;
	}
}

@media (max-width: 520px) {
	.steps {
		grid-template-columns: 1fr;
	}
}
</style>
