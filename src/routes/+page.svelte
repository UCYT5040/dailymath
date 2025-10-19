<script lang="ts">
	import Question from '$lib/components/Question.svelte';
	import { testNames, tests, type Test } from '$lib/tests.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	let testsSubscribed: Record<Test, boolean> = $state({
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

	let subscriptionsList = $derived.by(() => {
		return tests.filter((test) => testsSubscribed[test]);
	});

	let question: any = $state(null);

	let subscriptionsPanelOpen = $state(false);

	async function getQuestionData(tests: Test[], count: number) {
		const response = await fetch(`/api/v1/questions/${tests.join(',')}?count=${count}`);
		const questionData = await response.json();
		for (let q of questionData.questions) {
			queue.push(q);
		}
	}

	let queue = $state([]);

	async function getQuestion() {
		if (queue.length === 0 && subscriptionsList.length > 0) {
			await getQuestionData(subscriptionsList, 5);
		}
		if (queue.length > 0) {
			question = queue.shift();
		} else {
			question = null;
		}
		if (queue.length < 3 && subscriptionsList.length > 0) {
			getQuestionData(subscriptionsList, 5);
		}
	}

	onMount(() => {
		// Load subscriptions from localStorage
		const saved = localStorage.getItem('testsSubscribed');
		if (saved) {
			testsSubscribed = JSON.parse(saved);
		}

		getQuestion();
	});

	$effect(() => {
		// Save subscriptions to localStorage
		localStorage.setItem('testsSubscribed', JSON.stringify(testsSubscribed));
	});

	function handleQuestionUpdate(updatedQuestion: any) {
		question = updatedQuestion;
	}
</script>

<button
			class="fixed right-4 bottom-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			onclick={getQuestion}
		>
			Next Question
		</button>

<div class="flex h-screen">
	{#if subscriptionsPanelOpen}
		<div class="flex h-full w-1/4 border-r border-gray-600 p-4">
			<div class="flex-grow">
				<h2 class="mb-4 text-xl font-bold">Subscriptions</h2>
				{#each tests as test}
					<div class="mb-2 flex items-center">
						<input type="checkbox" bind:checked={testsSubscribed[test]} id={test} class="mr-2" />
						<label for={test} class="capitalize">{testNames[test]}</label>
					</div>
				{/each}
			</div>
			<button
				class="flex h-full items-center p-2 text-gray-600"
				onclick={() => (subscriptionsPanelOpen = false)}
				aria-label="Close Subscriptions Panel"
			>
				&lt;
			</button>
		</div>
	{:else}
		<div class="h-full border-r border-gray-600">
			<button
				class="flex h-full items-center p-2 text-gray-600"
				onclick={() => (subscriptionsPanelOpen = true)}
				aria-label="Open Subscriptions Panel"
			>
				&gt;
			</button>
		</div>
	{/if}
	{#if question}
		<div class="w-full flex-grow flex flex-col">
			<a
				href={`/question/${question.$id}`}
				class="block underline mb-4 text-center"
				target="_blank"
				rel="noopener noreferrer"
			>
				Permanent Question Link
			</a>
			<div class="flex-grow flex items-center justify-center">
				<Question {question} onQuestionUpdate={handleQuestionUpdate} />
			</div>
			
			<p class="text-gray-600">
				Questions and answers are the intellectual property of ICTM.<br>
				We are using them here for non-commercial, educational purposes only, what we believe to be fair use.<br>
				If you have any questions, please email <a class="underline" href="mailto:webmaster@math.chocosmalos.net">webmaster@math.chocosmalos.net</a>.
			</p>
		</div>
	{:else if subscriptionsList.length === 0}
		<div class="flex w-3/4 flex-col items-center justify-center p-4">
			<p class="text-gray-600">No subscriptions selected. Please subscribe to tests.</p>
		</div>
	{:else}
		<div class="flex w-3/4 flex-col items-center justify-center p-4">
			<p class="text-gray-600">Loading...</p>
		</div>
	{/if}
</div>
