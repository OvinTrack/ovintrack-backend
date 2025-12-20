import Map from "@/components/Map";
import { User } from "@prisma/client";
//import prisma from "@/lib/prisma";

export const points = [
  { lat: 36.7538, lng: 3.0588, label: "Alger" },
  { lat: 35.6971, lng: -0.6308, label: "Oran" },
  { lat: 36.365, lng: 6.6147, label: "Constantine" }
];

// Récupére tous les utilisateurs
// Directemeent via Prisma
//const users = await prisma.user.findMany();
// Ou via l'API interne
const users = await fetch('http://localhost:3000/api/users')
  .then(res => res.json())
  .then(data => data.users);

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
          <li className="mt-2">
            {users.map((user: User) => (
              <ul key={user.id}>{user.name} ({user.email}) </ul>
            ))}
          </li>
        </div>
      </main>
    </div>
  );
}
