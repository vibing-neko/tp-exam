<script setup>
import { animate } from 'animejs'
import NavBar from './components/NavBar.vue'
import { reduced } from './anim.js'

function onEnter(el, done) {
	if (reduced) return done()
	// 結束後 revert 清掉 inline transform，否則頁內 position: fixed 會以此元素為基準
	animate(el, { opacity: [0, 1], translateY: [16, 0], duration: 520, ease: 'outExpo', onComplete: a => { a.revert(); done() } })
}

function onLeave(el, done) {
	if (reduced) return done()
	animate(el, { opacity: 0, translateY: -8, duration: 180, ease: 'inQuad', onComplete: done })
}
</script>

<template>
	<NavBar />
	<RouterView v-slot="{ Component, route }">
		<Transition :css="false" mode="out-in" @enter="onEnter" @leave="onLeave">
			<component :is="Component" :key="route.path" />
		</Transition>
	</RouterView>
</template>
