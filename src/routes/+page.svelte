<script lang="ts">
	import { formatCompetition } from '$lib/competition.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	const tests = {
		algebra1: 'Algebra 1',
		geometry: 'Geometry',
		algebra2: 'Algebra 2',
		precalculus: 'Precalculus',
		calculator: 'Calculator',
		fs2: 'Freshman Sophomore 2',
		js2: 'Junior Senior 2',
		fs8: 'Freshman Sophomore 8',
		js8: 'Junior Senior 8'
	};

	let answersRevealed = $state({
		algebra1: false,
		geometry: false,
		algebra2: false,
		precalculus: false,
		calculator: false,
		fs2: false,
		js2: false,
		fs8: false,
		js8: false
	});

	let testsSubscribed = $state({
		algebra1: false,
		geometry: false,
		algebra2: false,
		precalculus: false,
		calculator: false,
		fs2: false,
		js2: false,
		fs8: false,
		js8: false
	});

	onMount(() => {
		// Load subscriptions from localStorage
		const saved = localStorage.getItem('testsSubscribed');
		if (saved) {
			testsSubscribed = JSON.parse(saved);
		}
	});

	$effect(() => {
		// Save subscriptions to localStorage
		localStorage.setItem('testsSubscribed', JSON.stringify(testsSubscribed));
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="container mx-auto max-w-6xl px-4 py-8">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-800 md:text-5xl">Daily Math Questions</h1>
		</div>

		<!-- Subject Selection -->
		<div class="mb-8 rounded-xl bg-white p-6 shadow-lg">
			<h2 class="mb-6 text-center text-2xl font-semibold text-gray-800">Choose Your Subjects</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each Object.keys(tests) as test}
					<label
						class="flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 transition-all duration-200 hover:bg-gray-100 {testsSubscribed[
							test
						]
							? 'border-blue-500 bg-blue-50 text-blue-700'
							: 'border-gray-200 bg-gray-50'}"
					>
						<input type="checkbox" bind:checked={testsSubscribed[test]} class="sr-only" />
						<div class="flex items-center space-x-3">
							<div
								class="relative h-5 w-5 rounded border-2 transition-all duration-200 {testsSubscribed[
									test
								]
									? 'border-blue-500 bg-blue-500'
									: 'border-gray-400 bg-white'}"
							>
								<svg
									class="absolute top-0.5 left-0.5 h-3 w-3 text-white transition-opacity duration-200 {testsSubscribed[
										test
									]
										? 'opacity-100'
										: 'opacity-0'}"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
							</div>
							<span class="font-medium">{tests[test]}</span>
						</div>
					</label>
				{/each}
			</div>
		</div>

		<!-- Questions Grid -->
		<div class="grid gap-8">
			{#each data.questions as { test, questionData }}
				{#if testsSubscribed[test]}
					<div class="overflow-hidden rounded-xl bg-white shadow-lg">
						<!-- Question Header -->
						<div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
							<h2 class="text-2xl font-bold text-white">{tests[test]}</h2>
							<p class="mt-1 text-sm text-blue-100">
								From {formatCompetition(questionData.competition)}
							</p>
						</div>

						<!-- Question Content -->
						<div class="p-6">
							<div class="mb-6">
								<h3 class="mb-4 text-lg font-semibold text-gray-800">Question:</h3>
								<div class="rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
									<img
										src="/api/v1/questions/{questionData.question.$id}"
										alt="Question {questionData.question.$id} for {tests[test]}"
										class="h-auto max-w-full rounded-lg shadow-sm"
									/>
								</div>
							</div>

							<!-- Answer Section -->
							<div class="border-t border-gray-200 pt-6">
								{#if answersRevealed[test]}
									<div>
										<h3 class="mb-4 text-lg font-semibold text-green-700">Answer:</h3>
										<div class="rounded-lg border-2 border-green-200 bg-green-50 p-4">
											<img
												src="/api/v1/questions/{questionData.question.$id}/answer"
												alt="Answer for question {questionData.question.$id}"
												class="h-auto max-w-full rounded-lg shadow-sm"
											/>
										</div>
									</div>
								{:else}
									<div class="w-full">
										<button
											onclick={() => (answersRevealed[test] = true)}
											class="flex w-full transform items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
										>
											<svg
												class="mr-2 h-5 w-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												></path>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												></path>
											</svg>
											Show Answer
										</button>
									</div>
								{/if}
							</div>

							<p class="text-center mt-2">
								<a href="/questions/{questionData.question.$id}" class="text-blue-600 hover:underline">
									Solutions</a
								>
							</p>
						</div>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Empty State -->
		{#if Object.values(testsSubscribed).every((sub) => !sub)}
			<div class="py-12 text-center">
				<div
					class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200"
				>
					<svg
						class="h-12 w-12 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-semibold text-gray-600">No subjects selected</h3>
				<p class="text-gray-500">
					Choose one or more subjects above to see your daily math questions.
				</p>
			</div>
		{/if}
	</div>
</div>
