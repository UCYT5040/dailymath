<script lang="ts">
	import Question from '$lib/components/Question.svelte';
	import type { PageServerData } from './$types';

    const { data }: {data: PageServerData} = $props();
</script>

{#if data.reported}
	<div class="mb-4 rounded border-l-4 border-yellow-500 bg-yellow-100 p-4 m-2">
		<h2 class="mb-2 text-lg font-semibold text-yellow-800">Report Received</h2>
		<p class="text-yellow-800">
			<strong>Thank you for your report.</strong> Our team will review the question shortly.
		</p>
		<a href="/" class="mt-2 inline-block text-yellow-800 underline">Return to Home</a>
	</div>
{/if}

<Question question={data} />

