import { reactive, watch } from 'vue'
import { questions, chapters, cards } from './data/index.js'

const KEY = 'tpx-progress-v1'
// Leitner 盒子的複習間隔（分鐘）：考前衝刺用，間隔刻意偏短
const GAP = [0, 5, 30, 180, 1440, 4320]

function load() {
	try {
		const raw = localStorage.getItem(KEY)
		if (raw) return JSON.parse(raw)
	} catch (e) {}
	return null
}

const blank = () => ({ q: {}, k: {}, exams: [], days: {} })

export const state = reactive(Object.assign(blank(), load() || {}))

watch(state, v => {
	try {
		localStorage.setItem(KEY, JSON.stringify(v))
	} catch (e) {}
}, { deep: true })

const today = () => new Date().toLocaleDateString('sv-SE')

function bumpDay() {
	const d = today()
	state.days[d] = (state.days[d] || 0) + 1
}

export function qStat(id) {
	return state.q[id] || { b: 0, s: 0, r: 0, w: 0, t: 0, d: 0 }
}

export function answer(id, ok) {
	const s = { ...qStat(id) }
	const now = Date.now()
	s.s++
	if (ok) {
		s.r++
		s.b = Math.min(5, s.b + 1)
	} else {
		s.w++
		s.b = 0
	}
	s.t = now
	s.d = now + GAP[s.b] * 60000
	state.q[id] = s
	bumpDay()
	return s
}

export function toggleStar(id) {
	const s = { ...qStat(id) }
	s.star = s.star ? 0 : 1
	state.q[id] = s
}

// 熟練度：盒子 4 以上視為熟練
const level = id => Math.min(qStat(id).b, 4) / 4

export function statsOf(list) {
	let seen = 0, right = 0, total = 0, sum = 0, mastered = 0
	for (const q of list) {
		const s = qStat(q.id)
		if (s.s) seen++
		right += s.r
		total += s.s
		sum += level(q.id)
		if (s.b >= 4) mastered++
	}
	return {
		n: list.length,
		seen,
		mastered,
		acc: total ? right / total : 0,
		mastery: list.length ? sum / list.length : 0
	}
}

const byCh = {}
for (const q of questions) (byCh[q.ch] ||= []).push(q)

export const chapterQuestions = id => byCh[id] || []
export const chapterStats = id => statsOf(byCh[id] || [])
export const subjectStats = sub => statsOf(questions.filter(q => q.subject === sub))

export function weakChapters(n = 3, subject = 0) {
	return chapters
		.filter(c => !subject || c.subject === subject)
		.map(c => ({ c, st: chapterStats(c.id) }))
		.sort((a, b) => a.st.mastery - b.st.mastery || a.c.id.localeCompare(b.c.id))
		.slice(0, n)
}

export function dueCount(subject = 0) {
	const now = Date.now()
	return questions.filter(q => (!subject || q.subject === subject) && qStat(q.id).s && qStat(q.id).d <= now && qStat(q.id).b < 5).length
}

// 智慧選題：到期的錯題 > 未練過（弱章節加權）> 到期複習 > 其他
export function pickSmart({ subject = 0, ch = '', n = 10 } = {}) {
	const now = Date.now()
	const pool = questions.filter(q => (!subject || q.subject === subject) && (!ch || q.ch === ch))
	const weak = {}
	for (const c of chapters) weak[c.id] = 1 - chapterStats(c.id).mastery
	const scored = pool.map(q => {
		const s = qStat(q.id)
		let p
		if (s.s && s.w && s.b < 2 && s.d <= now) p = 4
		else if (!s.s) p = 2.5 + weak[q.ch]
		else if (s.d <= now) p = 1.5 + (5 - s.b) * 0.2
		else p = 0.2 * (5 - s.b) / 5
		return { q, p: p + Math.random() * 0.6 }
	})
	return scored.sort((a, b) => b.p - a.p).slice(0, n).map(x => x.q)
}

export function wrongList() {
	return questions
		.filter(q => {
			const s = qStat(q.id)
			return s.star || (s.w && s.b < 3)
		})
		.sort((a, b) => qStat(b.id).w - qStat(a.id).w)
}

export function cardStat(id) {
	return state.k[id] || { b: 0, d: 0, n: 0 }
}

export function gradeCard(id, known) {
	const s = { ...cardStat(id) }
	s.n++
	s.b = known ? Math.min(5, s.b + 1) : 0
	s.d = Date.now() + GAP[s.b] * 60000
	state.k[id] = s
	bumpDay()
}

export function cardDeck({ subject = 0, ch = '' } = {}) {
	const now = Date.now()
	return cards
		.filter(k => (!subject || k.subject === subject) && (!ch || k.ch === ch))
		.map(k => ({ k, s: cardStat(k.id) }))
		.sort((a, b) => (a.s.d <= now ? 0 : 1) - (b.s.d <= now ? 0 : 1) || a.s.b - b.s.b || Math.random() - 0.5)
		.map(x => x.k)
}

export function saveExam(rec) {
	state.exams.unshift(rec)
	state.exams.splice(20)
}

export function streakDays() {
	let n = 0
	const d = new Date()
	for (;;) {
		const key = d.toLocaleDateString('sv-SE')
		if (!state.days[key]) break
		n++
		d.setDate(d.getDate() - 1)
	}
	return n
}

export function todayCount() {
	return state.days[today()] || 0
}

export function resetAll() {
	Object.assign(state, blank())
}
