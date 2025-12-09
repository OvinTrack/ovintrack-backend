import Map from "./components/Map";

export const points = [
  { lat: 36.7538, lng: 3.0588, label: "Alger" },
  { lat: 35.6971, lng: -0.6308, label: "Oran" },
  { lat: 36.365, lng: 6.6147, label: "Constantine" }
];

export default function Home()
{
  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black w-full h-full">
      <main className="flex w-full h-full flex-col items-center justify-between bg-white dark:bg-black sm:items-start m-5">
        <h1 className="text-2xl font-bold w-full text-center">Exemple de carte avec des points GPS</h1>
        <div className="w-full h-full flex items-center justify-center">
          <Map points={points} />
        </div>
      </main>
    </div>
  );
}
