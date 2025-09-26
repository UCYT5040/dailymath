<script lang="ts">
    import {formatCompetition} from "$lib/competition";

    let {form, data} = $props();

    let competition = $state("");
</script>

<h1>Competitions</h1>
{#if data.competitions.length === 0}
    <p>No competitions found.</p>
{:else}
    <form method="POST">
        {#each data.competitions as comp}
            <label>
                <input type="checkbox" name="competition-{comp.$id}" bind:checked={comp.active} />
                {formatCompetition(comp)}
            </label>
        {/each}
        <button type="submit">Save</button>
    </form>
{/if}