// 找出題目最相關的章節重點：以兩字詞（bigram）重疊比對，罕見詞權重較高
const clean = s => s.replace(/\*\*/g, '').toLowerCase()

function grams(s) {
	const out = new Set()
	const t = clean(s).replace(/[^\p{L}\p{N}.%]+/gu, ' ')
	for (const w of t.split(' ')) {
		for (let i = 0; i < w.length - 1; i++) out.add(w.slice(i, i + 2))
	}
	return out
}

const cache = new Map()

function index(ch) {
	if (cache.has(ch.id)) return cache.get(ch.id)
	const items = []
	ch.sections.forEach((s, i) => s.items.forEach((t, j) => items.push({ key: `${i}-${j}`, g: grams(s.h + ' ' + t) })))
	const df = new Map()
	for (const it of items) for (const g of it.g) df.set(g, (df.get(g) || 0) + 1)
	const idx = { items, df }
	cache.set(ch.id, idx)
	return idx
}

// 回傳相關重點的 key（"段落-條目"），最多 2 條
export function relatedNotes(ch, q) {
	const { items, df } = index(ch)
	const qg = grams(q.q + ' ' + q.o[0] + ' ' + q.e)
	const scored = items
		.map(it => {
			let s = 0
			for (const g of qg) if (it.g.has(g)) s += 1 / df.get(g)
			return { key: it.key, s }
		})
		.sort((a, b) => b.s - a.s)
	if (!scored.length || scored[0].s < 0.8) return []
	return scored.filter((x, i) => i < 2 && x.s >= scored[0].s * 0.75).map(x => x.key)
}
