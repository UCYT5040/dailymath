<script lang="ts">
	import { formatCompetition, type Competition } from '$lib/competition';
	import { testNames, type Test } from '$lib/tests.js';

	let { data } = $props();
</script>

{#if data.question}
	<h1 class="mb-4 text-3xl font-bold">
		Solve Question {data.question.questionNumber} - {testNames[data.question.test as Test]}
	</h1>
	<p class="mb-2">
		<strong>Competition:</strong>
		{formatCompetition(data.competition as unknown as Competition)}
	</p>
	<img
		src="/api/v1/questions/{data.question.$id}"
		alt="Question"
		class="mb-4 h-auto max-w-full rounded border"
	/>
	<h2 class="mb-2 text-2xl font-bold">Answer</h2>
	<img
		src="/api/v1/questions/{data.question.$id}/answer"
		alt="Answer"
		class="mb-4 h-auto max-w-full rounded border"
	/>
	<p>Only upload solutions resulting in the above correct answer.</p>
	<h2 class="mb-2 text-2xl font-bold">Your Solution</h2>
	<form method="POST" enctype="multipart/form-data" class="mb-4">
		<div class="mb-4">
			<label for="solution" class="mb-2 block font-semibold"
				>Upload your solution (image or video):</label
			>
			<input
				type="file"
				id="solution"
				name="solution"
				accept="image/*,video/*"
				required
				class="w-full rounded border p-2"
			/>
		</div>
		<button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>Submit Solution</button
		>
	</form>
{:else}
	<h1 class="mb-4 text-3xl font-bold">Question not found</h1>
{/if}
