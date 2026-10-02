import { animate, onScroll, stagger, spring, utils } from 'animejs'

export const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// 捲動進入視窗時淡入上浮；同一批元素依序錯開
export function reveal(root, selector = '[data-reveal]') {
	const els = root.querySelectorAll(selector)
	if (!els.length) return
	if (reduced) return
	utils.set(els, { opacity: 0, translateY: 28 })
	els.forEach(el => {
		onScroll({
			target: el,
			enter: 'bottom-=40 top',
			repeat: false,
			onEnter: () => animate(el, {
				opacity: [0, 1],
				translateY: [28, 0],
				duration: 900,
				delay: (Number(el.dataset.reveal) || 0) * 70,
				ease: 'outExpo'
			})
		})
	})
}

// 數字由 0 滾到目標值
export function countUp(el, to, { decimals = 0, duration = 1400, suffix = '' } = {}) {
	if (!el) return
	const o = { v: 0 }
	const fmt = v => v.toLocaleString('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
	if (reduced) {
		el.textContent = fmt(to)
		return
	}
	animate(o, {
		v: to,
		duration,
		ease: 'outExpo',
		onUpdate: () => (el.textContent = fmt(o.v))
	})
}

// 按下去的回彈手感
export function press(el) {
	if (!el || reduced) return
	animate(el, { scale: [0.94, 1], ease: spring({ bounce: 0.55, duration: 420 }) })
}

export function staggerIn(targets, opts = {}) {
	if (reduced) return
	return animate(targets, {
		opacity: [0, 1],
		translateY: [opts.y ?? 18, 0],
		delay: stagger(opts.gap ?? 45, { start: opts.start ?? 0 }),
		duration: opts.duration ?? 700,
		ease: 'outExpo'
	})
}
