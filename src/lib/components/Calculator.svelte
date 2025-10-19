<script lang="ts">
	import Calculator from "@lucide/svelte/icons/calculator";
	import X from "@lucide/svelte/icons/x";

	let active = $state(false);
	let isDragging = $state(false);
	let position = $state({ x: 100, y: 100 });
	let dragOffset = $state({ x: 0, y: 0 });

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		dragOffset.x = event.clientX - position.x;
		dragOffset.y = event.clientY - position.y;

		// Prevent text selection while dragging
		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;

		position.x = event.clientX - dragOffset.x;
		position.y = event.clientY - dragOffset.y;

		// Keep calculator within viewport bounds
		const maxX = window.innerWidth - 368;
		const maxY = window.innerHeight - 720;

		position.x = Math.max(0, Math.min(position.x, maxX));
		position.y = Math.max(0, Math.min(position.y, maxY));
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Add global event listeners for mouse events
	$effect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);

			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	});
</script>


<button
    class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    onclick={() => (active = true)}
    disabled={active}
	title="Open Calculator"
>
    <Calculator />
</button>

{#if active}
	<div
		class="fixed z-[200] rounded-lg border border-gray-300 bg-white shadow-2xl"
		style="left: {position.x}px; top: {position.y}px;"
	>
		<div
			class="flex cursor-move items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-100 px-4 py-2 select-none"
			onmousedown={handleMouseDown}
            role="button"
            tabindex="0"
		>
			<div class="flex items-center gap-2">
				<Calculator />
				<span class="text-sm font-medium text-gray-700">Calculator</span>
			</div>
			<button
				class="rounded p-1 text-gray-500 transition-colors hover:bg-red-50"
				onclick={() => (active = false)}
				aria-label="Close calculator"
			>
				<X />
			</button>
		</div>

		<div class="p-2">
			<iframe
				title="Numworks calculator"
				src="https://www.numworks.com/simulator/embed/"
				width="368px"
				height="720px"
				class="rounded"
			></iframe>
		</div>
	</div>
{/if}
