<script lang="ts">
    let {data} = $props();

    const tests = {
        "algebra1": "Algebra 1",
        "geometry": "Geometry",
        "algebra2": "Algebra 2",
        "precalculus": "Precalculus",
        "calculator": "Calculator",
        "fs2": "Freshman Sophomore 2",
        "js2": "Junior Senior 2",
        "fs8": "Freshman Sophomore 8",
        "js8": "Junior Senior 8"
    }

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
</script>

{#each data.questions as { test, questionId } }
    <h2>{tests[test]}</h2>
    <img src="/api/v1/questions/{questionId}" alt="Question {questionId} for {tests[test]}" />
    {#if answersRevealed[test]}
        <img src="/api/v1/questions/{questionId}/answer" alt="Answer for question {questionId}" />
    {:else}
        <button onclick={() => answersRevealed[test] = true}>Show Answer</button>
    {/if}
{/each}