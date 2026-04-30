"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FullTraccarUser } from "@/types/traccar-types";
import UserForm from "./UserForm";

type View = "list" | "create" | "edit";

export default function UserList()
{
  const [users, setUsers] = useState<FullTraccarUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [view, setView] = useState<View>("list");
  const [selectedUser, setSelectedUser] = useState<FullTraccarUser | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUsers = async () =>
  {
    setLoading(true);
    setError("");
    try
    {
      const response = await fetch("/api/traccar/users", { credentials: "include" });
      const data = await response.json() as FullTraccarUser[] & { message?: string };

      if (!response.ok)
      {
        throw new Error((data as unknown as { message?: string }).message ?? "Erreur lors du chargement");
      }

      setUsers(data);
    }
    catch (err: unknown)
    {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    finally
    {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchUsers(); }, []);

  const showSuccess = (msg: string) =>
  {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleCreate = () =>
  {
    setSelectedUser(undefined);
    setView("create");
  };

  const handleEdit = (user: FullTraccarUser) =>
  {
    setSelectedUser(user);
    setView("edit");
  };

  const handleFormSuccess = async (savedUser: FullTraccarUser) =>
  {
    const isEditing = view === "edit";
    setView("list");
    setSelectedUser(undefined);
    await fetchUsers();
    showSuccess(isEditing
      ? `Utilisateur "${savedUser.name}" mis à jour avec succès.`
      : `Utilisateur "${savedUser.name}" créé avec succès.`
    );
  };

  const handleCancel = () =>
  {
    setView("list");
    setSelectedUser(undefined);
  };

  const handleDelete = async (user: FullTraccarUser) =>
  {
    if (!confirm(`Supprimer l'utilisateur "${user.name}" (${user.email}) ? Cette action est irréversible.`))
    {
      return;
    }

    setDeletingId(user.id);

    try
    {
      const response = await fetch(`/api/traccar/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok)
      {
        const data = await response.json() as { message?: string };
        throw new Error(data.message ?? "Erreur lors de la suppression");
      }

      setUsers(prev => prev.filter(u => u.id !== user.id));
      showSuccess(`Utilisateur "${user.name}" supprimé.`);
    }
    catch (err: unknown)
    {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    finally
    {
      setDeletingId(null);
    }
  };

  if (view === "create" || view === "edit")
  {
    return (
      <UserForm
        user={selectedUser}
        onSuccess={handleFormSuccess}
        onCancel={handleCancel} />
    );
  }

  const renderContent = () =>
  {
    if (loading)
    {
      return <div className="text-center py-12 text-gray-500">Chargement...</div>;
    }

    if (users.length === 0)
    {
      return (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow">
          Aucun utilisateur trouvé.&nbsp;<button onClick={handleCreate} className="ml-2 text-blue-600 underline hover:no-underline hover:cursor-pointer">Créer le premier</button>
        </div>
      );
    }

    return (
      <div className="bg-white shadow-md rounded-2xl overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {users.map(user => (
            <div key={user.id} className="p-4">
              <div>
                <p className="text-xs text-gray-400">ID: <span className="font-mono">{user.id}</span></p>
                <p className="text-base font-semibold text-gray-900 mt-1">{user.name}</p>
                <p className="text-sm text-gray-600 mt-0.5">{user.email}</p>
                {user.administrator && (
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Admin</span>
                )}
                {user.disabled && (
                  <span className="inline-block mt-1 ml-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Désactivé</span>
                )}
              </div>
              <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto">
                <Link
                  href={{ pathname: "/", query: { userId: String(user.id), userName: user.name } }}
                  className="shrink-0 text-emerald-700 border border-emerald-200 hover:text-emerald-900 px-3 py-2 rounded-lg hover:bg-emerald-50 transition text-center whitespace-nowrap">
                  Voir sur la carte
                </Link>
                <Link
                  href={{ pathname: "/devices", query: { userId: String(user.id), userName: user.name } }}
                  className="shrink-0 text-cyan-700 border border-cyan-200 hover:text-cyan-900 px-3 py-2 rounded-lg hover:bg-cyan-50 transition text-center whitespace-nowrap">
                  Voir la liste
                </Link>
                <button
                  onClick={() => handleEdit(user)}
                  aria-label={`Modifier ${user.name}`}
                  title="modifier"
                  className="shrink-0 text-blue-600 border border-blue-200 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition hover:cursor-pointer flex items-center justify-center whitespace-nowrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                  </svg>
                </button>
                <button
                  onClick={() => void handleDelete(user)}
                  disabled={deletingId === user.id}
                  aria-label={`Supprimer ${user.name}`}
                  title="Supprimer"
                  className="shrink-0 text-red-600 border border-red-200 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50 hover:cursor-pointer flex items-center justify-center whitespace-nowrap">
                  {deletingId === user.id ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">ID</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Nom</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Rôle</th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-400 font-mono">{user.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.name}
                    {user.disabled && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Désactivé</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.administrator
                      ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Admin</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Utilisateur</span>
                    }
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap">
                      <Link
                        href={{ pathname: "/", query: { userId: String(user.id), userName: user.name } }}
                        className="text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-lg hover:bg-emerald-50 transition whitespace-nowrap text-xs">
                        Voir sur la carte
                      </Link>
                      <Link
                        href={{ pathname: "/devices", query: { userId: String(user.id), userName: user.name } }}
                        className="text-cyan-700 hover:text-cyan-900 px-2 py-1 rounded-lg hover:bg-cyan-50 transition whitespace-nowrap text-xs">
                        Voir la liste
                      </Link>
                      <button
                        onClick={() => handleEdit(user)}
                        aria-label={`Modifier ${user.name}`}
                        title="modifier"
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition hover:cursor-pointer inline-flex items-center justify-center whitespace-nowrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => void handleDelete(user)}
                        disabled={deletingId === user.id}
                        aria-label={`Supprimer ${user.name}`}
                        title="Supprimer"
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50 hover:cursor-pointer inline-flex items-center justify-center whitespace-nowrap">
                        {deletingId === user.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gestion des utilisateurs</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition hover:cursor-pointer">
          + Nouvel utilisateur
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
          <button
            onClick={() => void fetchUsers()}
            className="ml-3 underline hover:no-underline hover:cursor-pointer">
            Réessayer
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
