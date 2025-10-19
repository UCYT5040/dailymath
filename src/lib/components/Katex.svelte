<script lang="ts">
	import katex from 'katex';
	import 'katex/dist/katex.min.css';

	let { math, displayMode }: { math: string; displayMode: boolean } = $props();

	let container: HTMLSpanElement;

	$effect(() => {
		if (container) {
			try {
				katex.render(math, container, {
					throwOnError: true,
					displayMode: displayMode
				});
			} catch (error) {
				// Handle rendering errors gracefully
				container.textContent = `Error: ${(error as Error).message}`;
				container.style.color = 'red';
			}
		}
	});
</script>

<span bind:this={container}></span>

