<script lang="ts">
	import { formatCompetition, type Competition } from '$lib/competition';
import { testNames, type Test } from '$lib/tests.js';

    let {data} = $props();

    let answerHidden = $state(true);
</script>

{#if data.question}
<h1 class="text-3xl font-bold mb-4">Question {data.question.questionNumber} - {testNames[data.question.test as Test]}</h1>
<p class="mb-2"><strong>Competition:</strong> {formatCompetition(data.competition as unknown as Competition)}</p>
<img src="/api/v1/questions/{data.question.$id}" alt="Question" class="mb-4 max-w-full h-auto border rounded" />
<h2 class="text-2xl font-bold mb-2">Answer</h2>
{#if answerHidden}
    <p class="mb-4 italic text-gray-600">Answer is hidden. Click the button below to reveal it.</p>
    <button onclick={() => answerHidden = false} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Show Answer</button>
{:else}
    <img src="/api/v1/questions/{data.question.$id}/answer" alt="Answer" class="mb-4 max-w-full h-auto border rounded" />
{/if}
<h2 class="text-2xl font-bold mb-2">Solutions</h2>
{#if data.solutions.length > 0}
    <ul class="list-disc list-inside">
        {#each data.solutions as solution}
            {#if solution.type === 'image'}
                <li class="mb-4">
                    <img src="/api/v1/solutions/{solution.$id}" alt="Solution" class="max-w-full h-auto border rounded" />
                </li>
            {:else if solution.type === 'video'}
                <li class="mb-4">
                    <video controls class="max-w-full h-auto border rounded">
                        <source src="/api/v1/solutions/{solution.$id}" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </li>
            {/if}
        {/each}
    </ul>
{:else}
    <p>No solutions available.</p>
{/if}
<a href="/questions/{data.question.$id}/solve" class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add your solution</a>
{:else}
<h1 class="text-3xl font-bold mb-4">Question not found</h1>
{/if}
