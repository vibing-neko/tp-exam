const mods = import.meta.glob('./ch/*.js', { eager: true })

export const subjects = {
	1: { id: 1, name: '科目一', title: '電力系統與電力市場', minutes: 60, weight: 0.4, cls: 's1' },
	2: { id: 2, name: '科目二', title: '電力交易平台市場規則', minutes: 90, weight: 0.6, cls: 's2' }
}

// 排序：科目一 → 科目二；官方參考資料 c 在教材 t 之前
export const chapters = Object.values(mods)
	.map(m => m.default)
	.sort((a, b) => a.subject - b.subject || a.id.localeCompare(b.id))

export const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c]))

export const questions = chapters.flatMap(c =>
	c.questions.map((q, i) => ({
		id: `${c.id}-${i}`,
		ch: c.id,
		subject: c.subject,
		q: q.q,
		o: q.o,
		e: q.e
	}))
)

export const questionMap = Object.fromEntries(questions.map(q => [q.id, q]))

export const cards = chapters.flatMap(c =>
	c.cards.map((k, i) => ({ id: `${c.id}-k${i}`, ch: c.id, subject: c.subject, f: k.f, b: k.b }))
)

export const formulas = chapters.flatMap(c => c.formulas.map(f => ({ ...f, ch: c.id, subject: c.subject })))
