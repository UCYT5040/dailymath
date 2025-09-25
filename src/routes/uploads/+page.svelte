<script lang="ts">
    import {formatCompetition} from "$lib/competition";

    let {form, data} = $props();

    let competition = $state("");
</script>

<h1>Uploads</h1>
{#if data.uploads.length === 0}
    <p>No uploads found.</p>
{:else}
    <table class="min-w-full border-collapse border border-gray-300">
        <thead>
            <tr>
                <th class="border border-gray-300 px-4 py-2">Date</th>
                <th class="border border-gray-300 px-4 py-2">State</th>
                <th class="border border-gray-300 px-4 py-2">Competition</th>
                <th class="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
        </thead>
        <tbody>
            {#each data.uploads as upload}
                <tr class="hover:bg-gray-100">
                    <td class="border border-gray-300 px-4 py-2">{upload.$createdAt}</td>
                    <td class="border border-gray-300 px-4 py-2">
                        {#if upload.state === "processing"}
                            <span class="text-yellow-500 font-semibold">Processing</span>
                        {:else if upload.state === "processed"}
                            <span class="text-green-500 font-semibold">Processed</span>
                        {:else if upload.state === "finished"}
                            <span class="text-green-700 font-semibold">Finished</span>
                        {:else if upload.state === "error"}
                            <span class="text-red-500 font-semibold">Error</span>
                        {:else}
                            <span>{upload.state}</span>
                        {/if}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                        {#if upload.competitionId && data.competitionData[upload.competitionId]}
                            {formatCompetition(data.competitionData[upload.competitionId])}
                        {:else}
                            N/A
                        {/if}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                        <a class="text-blue-500 hover:underline" href={`/uploads/${upload.$id}/extract`}>Extract questions or answers</a>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}
