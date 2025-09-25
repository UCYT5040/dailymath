<script lang="ts">
    import {formatCompetition} from "$lib/competition";

    let {form, data} = $props();

    let competition = $state("");
</script>

{#if form?.body}
    {#if form.body.error}
        <p class="text-red-500">{form.body.error}</p>
    {/if}
    {#if form.body.message}
        <p class="text-green-500">{form.body.message}</p>
    {/if}
{/if}

<form method="POST" enctype="multipart/form-data">
    <h2>Competition</h2>
    <label for="competitionId">Select Competition (or create new):</label>
    <select bind:value={competition} id="competitionId" name="competitionId">
        <option value="" selected>Create new</option>
        {#each data.competitions as competition}
            <option value={competition.$id}>{formatCompetition(competition)}</option>
        {/each}
    </select>
    {#if competition === ""}
        <div>
            <label for="year">Year:</label>
            <input type="number" id="year" name="year" min="2000" required /> <!-- It is assumed no ICTM tests from before 2000 are being uploaded -->
        </div>
        <div>
            <label for="division">Division:</label>
            <select id="division" name="division" required>
                <option value="A">A</option>
                <option value="AA">AA</option>
            </select>
        </div>
        <div>
            <label for="location">Location:</label>
            <select id="location" name="location" required>
                <option value="regional">Regional</option>
                <option value="state">State</option>
            </select>
        </div>
    {/if}
    <h2>Upload PDF</h2>
    <input type="file" name="file" accept=".pdf" required />
    <button type="submit">Upload PDF</button>
</form>