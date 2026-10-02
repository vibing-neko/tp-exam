<script setup>
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { createAnimatable, animate, stagger } from 'animejs'
import Icon from './Icon.vue'
import { dueCount, wrongList } from '../store.js'

const route = useRoute()
const links = [
	{ to: '/', name: '首頁', icon: 'home' },
	{ to: '/map', name: '學習地圖', icon: 'map' },
	{ to: '/practice', name: '智慧練習', icon: 'bolt' },
	{ to: '/exam', name: '模擬考', icon: 'exam' },
	{ to: '/cards', name: '速記卡', icon: 'cards' },
	{ to: '/review', name: '錯題本', icon: 'wrong' },
	{ to: '/formulas', name: '公式', icon: 'sigma' },
	{ to: '/info', name: '考試資訊', icon: 'info' }
]
const mobileMain = ['/', '/map', '/practice', '/cards', '/exam']

const isOn = to => (to === '/' ? route.path === '/' : route.path.startsWith(to) || (to === '/map' && route.path.startsWith('/ch/')))

const bar = ref(null)
const ink = ref(null)
const sheet = ref(false)
const sheetEl = ref(null)
let mover = null

function moveInk() {
	const el = bar.value?.querySelector('a.on')
	if (!el || !mover) {
		if (ink.value) ink.value.style.opacity = el ? 1 : 0
		return
	}
	ink.value.style.opacity = 1
	mover.x(el.offsetLeft)
	mover.width(el.offsetWidth)
}

const theme = ref('light')
function readTheme() {
	theme.value = isDark() ? 'dark' : 'light'
}
function isDark() {
	const t = document.documentElement.dataset.theme
	if (t) return t === 'dark'
	return matchMedia('(prefers-color-scheme: dark)').matches
}
function toggleTheme() {
	const next = isDark() ? 'light' : 'dark'
	document.documentElement.dataset.theme = next
	theme.value = next
	try {
		localStorage.setItem('tpx-theme', next)
	} catch (e) {}
}

async function openSheet() {
	sheet.value = true
	await nextTick()
	animate(sheetEl.value.querySelectorAll('a, button'), { opacity: [0, 1], translateY: [16, 0], delay: stagger(35), duration: 500, ease: 'outExpo' })
}

onMounted(() => {
	readTheme()
	mover = createAnimatable(ink.value, { x: 650, width: 650, ease: 'outExpo' })
	nextTick(moveInk)
	addEventListener('resize', moveInk)
})
onBeforeUnmount(() => removeEventListener('resize', moveInk))
watch(() => route.path, () => {
	sheet.value = false
	nextTick(moveInk)
})
</script>

<template>
	<header class="top">
		<div class="wrap row">
			<RouterLink to="/" class="brand">
				<span class="pulse"><i /></span>
				<span class="name">電網學堂</span>
				<span class="tag mono">TP·EXAM 115</span>
			</RouterLink>
			<nav ref="bar" class="links">
				<RouterLink v-for="l in links" :key="l.to" :to="l.to" :class="{ on: isOn(l.to) }">
					{{ l.name }}
					<b v-if="l.to === '/practice' && dueCount()" class="dot num">{{ dueCount() }}</b>
				</RouterLink>
				<span ref="ink" class="ink" />
			</nav>
			<button class="icon-btn" aria-label="切換深淺色" @click="toggleTheme"><Icon :name="theme === 'dark' ? 'sun' : 'moon'" /></button>
			<button class="icon-btn only-m" aria-label="選單" @click="openSheet"><Icon name="menu" /></button>
		</div>
	</header>

	<nav class="tabbar">
		<RouterLink v-for="l in links.filter(x => mobileMain.includes(x.to))" :key="l.to" :to="l.to" :class="{ on: isOn(l.to) }">
			<Icon :name="l.icon" :size="22" />
			<span>{{ l.name.replace('智慧', '').replace('學習', '') }}</span>
		</RouterLink>
	</nav>

	<div v-if="sheet" class="scrim" @click.self="sheet = false">
		<div ref="sheetEl" class="sheet">
			<div class="sheet-head">
				<span class="eyebrow">選單</span>
				<button class="icon-btn" aria-label="關閉" @click="sheet = false"><Icon name="close" /></button>
			</div>
			<RouterLink v-for="l in links" :key="l.to" :to="l.to" :class="{ on: isOn(l.to) }">
				<Icon :name="l.icon" />{{ l.name }}
				<b v-if="l.to === '/review' && wrongList().length" class="dot num">{{ wrongList().length }}</b>
			</RouterLink>
		</div>
	</div>
</template>

<style scoped>
.top {
	position: sticky;
	top: 0;
	z-index: 50;
	height: var(--nav-h);
	background: color-mix(in srgb, var(--bg) 82%, transparent);
	backdrop-filter: saturate(1.4) blur(14px);
	-webkit-backdrop-filter: saturate(1.4) blur(14px);
	border-bottom: 1px solid var(--line);
}

.row {
	height: 100%;
	display: flex;
	align-items: center;
	gap: 12px;
}

.brand {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-right: auto;
	font-weight: 900;
}

.pulse {
	position: relative;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: var(--volt);
	flex: none;
}

.pulse i {
	position: absolute;
	inset: 0;
	border-radius: 50%;
	border: 2px solid var(--volt);
	animation: ping 1.67s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
	to {
		transform: scale(2.6);
		opacity: 0;
	}
}

.name {
	font-size: 18px;
	letter-spacing: 0.04em;
}

.tag {
	font-size: 11px;
	color: var(--muted);
	border: 1px solid var(--line-2);
	border-radius: 6px;
	padding: 1px 6px;
}

.links {
	position: relative;
	display: flex;
	gap: 2px;
}

.links a {
	position: relative;
	padding: 8px 11px;
	font-size: 14px;
	font-weight: 700;
	color: var(--muted);
	border-radius: 10px;
	transition: color 0.2s;
}

.links a:hover,
.links a.on {
	color: var(--ink);
}

.ink {
	position: absolute;
	left: 0;
	bottom: -12px;
	height: 3px;
	width: 0;
	border-radius: 3px;
	background: var(--volt);
	opacity: 0;
}

.dot {
	display: inline-grid;
	place-items: center;
	min-width: 18px;
	height: 18px;
	padding: 0 5px;
	margin-left: 4px;
	border-radius: 9px;
	font-size: 11px;
	background: var(--bad);
	color: #fff;
	vertical-align: 1px;
}

.icon-btn {
	display: grid;
	place-items: center;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	border: 1px solid var(--line);
	background: var(--card);
}

.only-m,
.tabbar {
	display: none;
}

.scrim {
	position: fixed;
	inset: 0;
	z-index: 80;
	background: rgba(0, 0, 0, 0.35);
	display: flex;
	justify-content: flex-end;
}

.sheet {
	width: min(320px, 86vw);
	height: 100%;
	background: var(--card);
	border-left: 1px solid var(--line);
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 4px;
	overflow-y: auto;
}

.sheet-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.sheet a {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	border-radius: 12px;
	font-weight: 700;
}

.sheet a.on {
	background: var(--bg-2);
}

@media (max-width: 1020px) {
	.links {
		display: none;
	}

	.only-m {
		display: grid;
	}

	.tabbar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 60;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
		background: color-mix(in srgb, var(--card) 90%, transparent);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-top: 1px solid var(--line);
	}

	.tabbar a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 6px 0;
		font-size: 11px;
		font-weight: 700;
		color: var(--muted);
		border-radius: 12px;
	}

	.tabbar a.on {
		color: var(--ink);
		background: var(--bg-2);
	}
}

@media (max-width: 420px) {
	.tag {
		display: none;
	}
}
</style>
