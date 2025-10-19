<script lang="ts">
	import { formatMarkdownWithLatex } from '$lib/formatting.js';
	import katex from 'katex';
	import 'katex/dist/katex.min.css';
	import { onMount } from 'svelte';

	interface Props {
		content: string;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	let htmlContent = $derived(formatMarkdownWithLatex(content));

	function renderMath() {
        // TODO: Is this setTimeout necessary?
		setTimeout(() => {
			// Render display math
			const displayMathElements = document.querySelectorAll('.content-wrapper .display-math');
			displayMathElements.forEach((element) => {
				// Skip if already rendered
				if (element.classList.contains('katex-rendered')) return;

				const mathContent = decodeURIComponent(element.getAttribute('data-math') || '');
				if (mathContent) {
					try {
						katex.render(mathContent, element as HTMLElement, {
							throwOnError: false,
							displayMode: true
						});
						element.classList.add('katex-rendered');
					} catch (error) {
						console.error('KaTeX rendering error for display math:', error);
						element.textContent = `$$${mathContent}$$`;
					}
				}
			});

			// Render inline math
			const inlineMathElements = document.querySelectorAll('.content-wrapper .inline-math');
			inlineMathElements.forEach((element) => {
				// Skip if already rendered
				if (element.classList.contains('katex-rendered')) return;

				const mathContent = decodeURIComponent(element.getAttribute('data-math') || '');
				if (mathContent) {
					try {
						katex.render(mathContent, element as HTMLElement, {
							throwOnError: false,
							displayMode: false
						});
						element.classList.add('katex-rendered');
					} catch (error) {
						console.error('KaTeX rendering error for inline math:', error);
						element.textContent = `$${mathContent}$`;
					}
				}
			});
		}, 0);
	}

	onMount(() => {
		renderMath();
	});

	$effect(() => {
		htmlContent;
		renderMath();
	});
</script>

<div class="content-wrapper {className}">
	<div class="prose prose-lg max-w-none">
		{@html htmlContent}
	</div>
</div>

<style>
	:global(.content-wrapper .display-math) {
		margin: 1rem 0;
		text-align: center;
	}

	:global(.content-wrapper .inline-math) {
		display: inline;
		vertical-align: baseline;
	}

	:global(.content-wrapper .prose p) {
		margin-bottom: 1rem;
	}
</style>
