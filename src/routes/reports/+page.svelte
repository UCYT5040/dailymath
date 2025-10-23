<script lang="ts">
	import Question from "$lib/components/Question.svelte";
	import { reportReasons, type ReportReason } from "$lib/reports";
	import type { PageServerData } from "./$types";

    const { data }: {data: PageServerData} = $props();

    let showUploads = $state(false);
    let selectedLargePrintPages: string[] = $state([]);

    async function processLargePrintPages() {
        if (selectedLargePrintPages.length === 0) {
            alert("No large print pages selected.");
            return;
        }

        const response = await fetch(`/api/v1/pages/${selectedLargePrintPages.join(',')}/processLargePrint` + `?competitionId=${data.question.competition.$id || ''}`);

        const result = await response.text();
        alert(result);
    }
</script>

<div class="flex">
    <Question question={data.question} />
    <div>
        <h1 class="text-2xl font-bold">Report</h1>
        <p class="text-lg">
            {reportReasons[data.reason as ReportReason]}
        </p>
        {#if data.details}
        <pre>{data.details}</pre>
        {:else}
        <p class="text-gray-600 italic">No additional details provided.</p>
        {/if}
        <table>
            <thead>
                <tr>
                    <th class="text-left font-semibold pr-4">Item</th>
                    <th class="text-left font-semibold">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="pr-4">Report ID</td>
                    <td>{data.$id}</td>
                </tr>
                <tr>
                    <td class="pr-4">Question ID</td>
                    <td>{data.question.$id}</td>
                </tr>
                {#if !data.question.questionContent}
                    <tr>
                        <td class="pr-4">Report Insight</td>
                        <td class="text-red-600 font-semibold">Question content is missing!</td>
                    </tr>
                {/if}
                {#if !data.question.answerContent}
                    <tr>
                        <td class="pr-4">Report Insight</td>
                        <td class="text-red-600 font-semibold">Answer content is missing!</td>
                    </tr>
                {/if}
            </tbody>
        </table>
        <button class="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onclick={() => (showUploads = !showUploads)}>
            {showUploads ? "Hide uploads" : "Show uploads related to this question"}
        </button>
        {#if showUploads}
            <div class="mt-4">
                {#if data.uploads.length > 0}
                    <h2 class="text-xl font-bold mb-2">Uploads</h2>
                    <ul>
                        {#each data.uploads as upload}
                            <h3>An upload with {upload.pages.length} pages</h3>
                            <ul>
                                {#each upload.pages as page}
                                    <li class="mb-4">
                                        <img src={`/api/v1/page/${page}/preview`} alt="An upload page preview" class="border max-w-32" />
                                        <p class="text-sm text-gray-600">Page {page.pageNumber}</p>
                                        <button onclick={async () => {
                                            const response = await fetch(`/api/v1/page/${page}/runAI?competitionId=${upload.competitionId}`);
                                            const text = await response.text();
                                            alert(text);
                                        }}>
                                            Run extraction AI for this page
                                        </button>
                                        {#if selectedLargePrintPages.includes(page)}
                                            <p class="text-green-600">This page is selected for large print processing.</p>
                                            <button onclick={() => {
                                                selectedLargePrintPages = selectedLargePrintPages.filter(p => p !== page);
                                            }}>
                                                Deselect Large Print Page
                                            </button>
                                        {:else}
                                            <button onclick={() => {
                                                selectedLargePrintPages = [...selectedLargePrintPages, page];
                                            }}>
                                                Select as Large Print Page
                                            </button>
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-gray-600 italic">No uploads associated with this question.</p>
                {/if}
            </div>
            <div class="mt-4">
                <h2 class="text-xl font-bold mb-2">Large Print Pages</h2>
                <p>For some reason, certain test packets omit small print questions for 2-person tests, only including large print versions.</p>
                <p>The processing AI was instructed to ignore large print pages, since they are duplicates of small print pages.</p>
                <p><strong>
                    If this test packet omits small print questions AND this report is on a 2-person test, please use the select button on each page, then click the button below.
                </strong></p>
                <button class="mt-2 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700" onclick={processLargePrintPages}>
                    Process Selected Large Print Pages
                </button>
            </div>
        {/if}
        <form method="POST" class="mt-6">
            <input type="hidden" name="reportId" value={data.$id} />
            <button type="submit" class="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                Mark Report as Resolved
            </button>
        </form>
    </div>
</div>