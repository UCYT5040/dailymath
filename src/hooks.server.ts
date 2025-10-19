import { startCronJobs } from "$lib/server/pageProcessing";
import type { ServerInit } from "@sveltejs/kit";

export const init: ServerInit = () => {
    startCronJobs();
}