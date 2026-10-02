<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { animate, stagger } from 'animejs'
import Icon from '../components/Icon.vue'
import { chapterMap, subjects } from '../data/index.js'
import { wrongList, qStat, toggleStar } from '../store.js'
import { reduced } from '../anim.js'

const subject = ref(0)
const open = ref({})
const list = computed(() => wrongList().filter(q => !subject.value || q.subject === subject.value))

function toggle(id, e) {
	open.value[id] = !open.value[id]
	if (open.value[id] && !reduced) {
		nextTick(() => {
			const el = e.currentTarget.parentElement.querySelector('.ans')
			if (el) animate(el, { opacity: [0, 1], height: [0, el.scrollHeight], duration: 420, ease: 'outExpo', onComplete: a => a.revert() })
		})
	}
}

onMounted(() => {
	if (!reduced && list.value.length) animate('.wl-item', { opacity: [0, 1], translateY: [14, 0], delay: stagger(35), duration: 600, ease: 'outExpo', onComplete: a => a.revert() })
})
</script>

<template>
	<main class="page wrap narrow">
		<p class="eyebrow">Mistakes</p>
		<h1 class="h1">錯題本</h1>
		<p class="lead">答錯過、還沒連續答對 3 次的題目，以及你按星號收藏的題目，都會自動收在這裡。</p>

		<div class="bar-row">
			<div class="seg">
				<button :class="{ on: subject === 0 }" @click="subject = 0">全部 {{ wrongList().length }}</button>
				<button :class="{ on: subject === 1 }" @click="subject = 1">科目一</button>
				<button :class="{ on: subject === 2 }" @click="subject = 2">科目二</button>
			</div>
			<RouterLink v-if="list.length" to="/practice?mode=wrong&go=1" class="btn volt"><Icon name="bolt" />重練錯題</RouterLink>
		</div>

		<div v-if="!list.length" class="empty card">
			<Icon name="check" :size="40" />
			<p>目前沒有錯題。去做一輪智慧練習，答錯的題目會自動出現在這裡。</p>
			<RouterLink to="/practice" class="btn primary">智慧練習</RouterLink>
		</div>

		<div class="wl">
			<article v-for="q in list" :key="q.id" class="wl-item card">
				<button class="wl-head" @click="toggle(q.id, $event)">
					<span class="chip" :class="subjects[q.subject].cls">{{ chapterMap[q.ch].no }}</span>
					<span class="wl-q">{{ q.q }}</span>
					<span class="wl-meta mono">✕{{ qStat(q.id).w }}</span>
				</button>
				<div v-if="open[q.id]" class="ans">
					<p class="right">正解：{{ q.o[0] }}</p>
					<p class="muted">{{ q.e }}</p>
					<div class="ans-acts">
						<RouterLink :to="`/ch/${q.ch}`" class="small link">回章節：{{ chapterMap[q.ch].title }}</RouterLink>
						<button class="star" :class="{ on: qStat(q.id).star }" @click="toggleStar(q.id)">
							<Icon name="star" :size="18" />{{ qStat(q.id).star ? '已收藏' : '收藏' }}
						</button>
					</div>
				</div>
			</article>
		</div>
	</main>
</template>

<style scoped>
.narrow {
	max-width: 820px;
}

.bar-row {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin: 24px 0 16px;
}

.empty {
	display: grid;
	justify-items: center;
	gap: 6px;
}

.wl {
	display: grid;
	gap: 10px;
}

.wl-item {
	overflow: hidden;
}

.wl-head {
	width: 100%;
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 12px;
	align-items: start;
	padding: 14px 16px;
	border: 0;
	background: transparent;
	text-align: left;
	font-weight: 700;
	line-height: 1.55;
}

.wl-meta {
	color: var(--bad);
	font-size: 13px;
}

.ans {
	padding: 0 16px 14px;
	overflow: hidden;
}

.ans p {
	margin: 0 0 6px;
}

.right {
	color: var(--ok);
	font-weight: 700;
}

.ans-acts {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	margin-top: 8px;
}

.small {
	font-size: 13px;
}

.link {
	text-decoration: underline;
	text-underline-offset: 3px;
	color: var(--muted);
}

.star {
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

.star.on {
	color: #13161c;
	background: var(--volt);
	border-color: var(--volt);
}
</style>
