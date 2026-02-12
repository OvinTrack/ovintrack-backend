import Map from "@/components/Map";
import { getOvins } from "@/lib/utils";
import { Ovin } from "@/types/traccar-types";

export default async function Home()
{
    const points: Ovin[] = await getOvins();

    return (
        <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black w-full h-full">
            <main className="flex w-full h-full flex-col items-center justify-between bg-white dark:bg-black sm:items-start m-5">
                <h1 className="text-2xl font-bold w-full text-center">OVIN-TRACK</h1>
                <div className="w-full h-full flex items-center justify-center">
                    <Map points={points} />
                </div>
            </main>
        </div>
    );
}
