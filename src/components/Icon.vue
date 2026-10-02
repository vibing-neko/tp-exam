<script setup>
defineProps({ name: String, size: { type: Number, default: 20 } })

const paths = {
	home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5',
	map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13',
	bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z',
	exam: 'M7 3h10v18H7zM10 8h4M10 12h4M10 16h2',
	cards: 'M4 7h12v13H4zM8 4h12v13',
	wrong: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-3 5 6 6m0-6-6 6',
	info: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 7v5m0-8.5v.5',
	sigma: 'M18 5H6l6 7-6 7h12',
	sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4',
	moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
	menu: 'M4 7h16M4 12h16M4 17h16',
	close: 'M6 6l12 12M18 6 6 18',
	arrow: 'M5 12h14m-6-6 6 6-6 6',
	back: 'M19 12H5m6 6-6-6 6-6',
	star: 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z',
	check: 'M5 12.5 10 17l9-10',
	clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4v4l3 2',
	flip: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
	reset: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
	book: 'M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4Zm0 12a4 4 0 0 1 4-4h9'
}
</script>

<template>
	<svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
		stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path :d="paths[name]" />
	</svg>
</template>
