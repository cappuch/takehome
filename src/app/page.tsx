import { fetchJobs } from "@/lib/jobs";
import ClientHome from "./ClientHome";

export default async function Home() {
    const jobs = await fetchJobs();

    return <ClientHome jobs={jobs} />;
}
