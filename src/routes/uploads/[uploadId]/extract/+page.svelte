<script lang="ts">
	let { data } = $props();

	let pageNumber = $state(1);

	let overlayCanvas: HTMLCanvasElement | null = $state(null);
	let imageElement: HTMLImageElement | null = $state(null);
	let ctx: CanvasRenderingContext2D | null = $derived.by(() => {
		if (overlayCanvas) {
			return overlayCanvas.getContext('2d');
		}
		return null;
	});

	// Update canvas dimensions to match image
	function updateCanvasDimensions() {
		if (!overlayCanvas || !imageElement) return;

		const rect = imageElement.getBoundingClientRect();
		overlayCanvas.width = rect.width;
		overlayCanvas.height = rect.height;
		overlayCanvas.style.width = rect.width + 'px';
		overlayCanvas.style.height = rect.height + 'px';
	}

	// Handle window resize
	let resizeTimeout: number;
	function handleResize() {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			updateCanvasDimensions();
		}, 100); // Debounce resize events
	}

	// Setup resize listener and initial canvas sizing
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);

			// Initial setup when image loads
			if (imageElement) {
				imageElement.addEventListener('load', updateCanvasDimensions);
				// Also update if image is already loaded
				if (imageElement.complete) {
					updateCanvasDimensions();
				}
			}
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', handleResize);
				clearTimeout(resizeTimeout);
			}
			if (imageElement) {
				imageElement.removeEventListener('load', updateCanvasDimensions);
			}
		};
	});

	interface Selection {
		x: number; // Percentage of image width (0-1)
		y: number; // Percentage of image height (0-1)
		width: number; // Percentage of image width (0-1)
		height: number; // Percentage of image height (0-1)
		questionNumber: number;
		type: 'question' | 'answer';
		pageNumber: number;
	}

	let selections = $state<Selection[] | null>(null);
	$inspect(selections);

	let isDrawing = $state(false);
	let startX = $state(0);
	let startY = $state(0);

	let currentX = $state(0);
	let currentY = $state(0);

	function canvasMouseMove(event: MouseEvent) {
		if (!ctx || !overlayCanvas || !isDrawing) return;
		const rect = overlayCanvas.getBoundingClientRect();
		const scaleX = overlayCanvas.width / rect.width;
		const scaleY = overlayCanvas.height / rect.height;
		currentX = (event.clientX - rect.left) * scaleX;
		currentY = (event.clientY - rect.top) * scaleY;
	}

	function canvasMouseDown(event: MouseEvent) {
		if (!ctx || !overlayCanvas) return;
		isDrawing = true;
		const rect = overlayCanvas.getBoundingClientRect();
		const scaleX = overlayCanvas.width / rect.width;
		const scaleY = overlayCanvas.height / rect.height;
		startX = (event.clientX - rect.left) * scaleX;
		startY = (event.clientY - rect.top) * scaleY;
		currentX = startX;
		currentY = startY;
	}

	function canvasMouseUp(event: MouseEvent) {
		if (!ctx || !overlayCanvas || !isDrawing || !imageElement) return;
		isDrawing = false;
		const rect = overlayCanvas.getBoundingClientRect();
		const scaleX = overlayCanvas.width / rect.width;
		const scaleY = overlayCanvas.height / rect.height;
		const endX = (event.clientX - rect.left) * scaleX;
		const endY = (event.clientY - rect.top) * scaleY;

		const pixelX = Math.min(startX, endX);
		const pixelY = Math.min(startY, endY);
		const pixelWidth = Math.abs(endX - startX);
		const pixelHeight = Math.abs(endY - startY);

		// Convert pixel coordinates to percentages of image dimensions
		const imageWidth = imageElement.naturalWidth;
		const imageHeight = imageElement.naturalHeight;

		const x = pixelX / overlayCanvas.width;
		const y = pixelY / overlayCanvas.height;
		const width = pixelWidth / overlayCanvas.width;
		const height = pixelHeight / overlayCanvas.height;

		// Default values, adjustable by UI
		const questionNumber = selections ? selections.length + 1 : 1;
		const type = 'question';

		const newSelection: Selection = { x, y, width, height, questionNumber, type, pageNumber };
		selections = selections ? [...selections, newSelection] : [newSelection];
	}

	$effect(() => {
		if (!ctx || !overlayCanvas) return;
		ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
		if (selections) {
			// Only draw selections that belong to the current page
			const currentPageSelections = selections.filter((sel) => sel.pageNumber === pageNumber);
			currentPageSelections.forEach((sel) => {
				// Convert percentage coordinates back to pixels for drawing
				const pixelX = sel.x * overlayCanvas.width;
				const pixelY = sel.y * overlayCanvas.height;
				const pixelWidth = sel.width * overlayCanvas.width;
				const pixelHeight = sel.height * overlayCanvas.height;

				ctx.strokeStyle = sel.type === 'question' ? 'blue' : 'green';
				ctx.lineWidth = 2;
				ctx.strokeRect(pixelX, pixelY, pixelWidth, pixelHeight);
				ctx.font = '16px Arial';
				ctx.fillStyle = sel.type === 'question' ? 'blue' : 'green';
				ctx.fillText(`${sel.type} ${sel.questionNumber}`, pixelX + 5, pixelY + 20);
			});
		}
		// Draw current rectangle if drawing
		if (isDrawing) {
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 2;
			const width = currentX - startX;
			const height = currentY - startY;
			ctx.strokeRect(startX, startY, width, height);
		}
	});

	let test = $state('algebra1');

	async function saveSelections() {
		if (!data.upload) return;
		const selectionData = {
			uploadId: data.upload.$id,
			test,
			selections
		};
		// Send to server
		fetch('/api/v1/selections', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(selectionData)
		});
	}
</script>

{#if !data.upload || !data.competitionData}
	<p>Error loading upload or competition data.</p>
{:else}
	<h1>Extract Questions and Answers</h1>
	<p>Pages: {data.upload.pages.length}</p>
	<input type="number" bind:value={pageNumber} min="1" max={data.upload.pages.length} />
	<label for="test">Test:</label>
	<select id="test" name="test" bind:value={test}>
		<option value="algebra1">Algebra 1</option>
		<option value="geometry">Geometry</option>
		<option value="algebra2">Algebra 2</option>
		<option value="precalculus">Precalculus</option>
		<option value="calculator">Calculator</option>
		<option value="fs2">Freshman Sophomore 2</option>
		<option value="js2">Junior Senior 2</option>
		<option value="fs8">Freshman Sophomore 8</option>
		<option value="js8">Junior Senior 8</option>
	</select>
	{#if selections && selections.length > 0}
		<h2>Selections</h2>
		<ul>
			{#each selections as sel, index}
				<div
					class="selection-item mb-2 rounded border p-2 {sel.pageNumber === pageNumber
						? 'border-blue-300 bg-blue-50'
						: 'border-gray-300 bg-gray-50'}"
				>
					<div class="flex items-center gap-4">
						<span class="font-semibold">Page {sel.pageNumber}:</span>
						<label for="selection-{index}-type">Type:</label>
						<select id="selection-{index}-type" bind:value={sel.type}>
							<option value="question">Question</option>
							<option value="answer">Answer</option>
						</select>
						<label for="selection-{index}-number">Number:</label>
						<input
							type="number"
							id="selection-{index}-number"
							bind:value={sel.questionNumber}
							min="1"
							class="w-16"
						/>
						<button
							onclick={() => {
								if (!selections) return;
								selections = selections.filter((_, i) => i !== index);
							}}
							class="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600">Delete</button
						>
					</div>
				</div>
			{/each}
		</ul>
		<button onclick={() => saveSelections()}>Save selections</button>
	{/if}
	{#if pageNumber >= 1 && pageNumber <= data.upload.pages.length}
		<div class="relative inline-block">
			<img
				bind:this={imageElement}
				src="/api/v1/uploads/{data.upload.$id}/pages/{data.upload.pages[pageNumber - 1]}"
				alt="Page {pageNumber}"
				class="block h-auto max-w-full"
			/>
			<canvas
				bind:this={overlayCanvas}
				class="pointer-events-auto absolute top-0 left-0 cursor-crosshair"
				onmousedown={canvasMouseDown}
				onmouseup={canvasMouseUp}
				onmousemove={canvasMouseMove}
			></canvas>
		</div>
	{:else}
		<p class="text-red-500">Invalid page number.</p>
	{/if}
{/if}
