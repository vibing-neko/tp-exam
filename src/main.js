import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import './style.css'

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{ path: '/', component: Home },
		{ path: '/map', component: () => import('./views/MapView.vue') },
		{ path: '/ch/:id', component: () => import('./views/Chapter.vue'), props: true },
		{ path: '/practice', component: () => import('./views/Practice.vue') },
		{ path: '/exam', component: () => import('./views/Exam.vue') },
		{ path: '/cards', component: () => import('./views/Cards.vue') },
		{ path: '/review', component: () => import('./views/Review.vue') },
		{ path: '/formulas', component: () => import('./views/Formulas.vue') },
		{ path: '/info', component: () => import('./views/Info.vue') },
		{ path: '/:pathMatch(.*)*', redirect: '/' }
	],
	scrollBehavior: () => ({ top: 0 })
})

createApp(App).use(router).mount('#app')
