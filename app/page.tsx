import Map from "@/components/Map";
import { User } from "@prisma/client";

async function safeFetchJson(url: string, fallback: unknown = null)
{
  try
  {
    const res = await fetch(url);

    if (!res.ok)
      return fallback;

    return await res.json();
  }
  catch (e)
  {
    console.warn(`Fetch failed for ${url}:`, e);
    return fallback;
  }
}

const pointsData = await safeFetchJson('http://localhost:3000/api/sheeps', { sheeps: [] });
const points = pointsData?.sheeps ?? [];

// Récupére tous les utilisateurs (via API interne)
const usersData = await safeFetchJson('http://localhost:3000/api/users', { users: [] });
const users = usersData?.users ?? [];

export default async function Home()
{
  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black w-full h-full">
      <main className="flex w-full h-full flex-col items-center justify-between bg-white dark:bg-black sm:items-start m-5">
        <h1 className="text-2xl font-bold w-full text-center">Exemple de carte avec des points GPS</h1>
        <div className="w-full h-full flex items-center justify-center">
          <Map points={points} />
        </div>
        <div className="w-full text-center mt-4 text-gray-500 dark:text-gray-400">
          <h1 className="text-2xl font-bold w-full text-center">Contenu de la table User</h1>
          <ul className="mt-2">
            {users.map((user: User) => (
              <li key={user.id}>{user.name} ({user.email})</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
