"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FullTraccarDevice } from "@/types/traccar-types";
import DeviceForm from "./DeviceForm";

type View = "list" | "create" | "edit";

export default function DeviceList()
{
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("userId")?.trim() ?? "";
  const selectedUserName = searchParams.get("userName")?.trim() ?? "";
  const hasUserFilter = selectedUserId !== "";

  const [devices, setDevices] = useState<FullTraccarDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [view, setView] = useState<View>("list");
  const [selectedDevice, setSelectedDevice] = useState<FullTraccarDevice | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) =>
  {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters({});

  const hasActiveFilters = Object.values(filters).some(v => v.trim() !== "");

  const filteredDevices = devices.filter(device =>
  {
    const match = (value: string | undefined, key: string) =>
    {
      const f = filters[key]?.trim().toLowerCase();
      if (!f) return true;
      return (value ?? "").toLowerCase().includes(f);
    };

    return (
      match(String(device.id), "id") &&
      match(device.name, "name") &&
      match(device.uniqueId, "uniqueId") &&
      match(device.attributes?.DZId, "DZId") &&
      match(device.attributes?.eleveurId, "eleveurId") &&
      match(device.attributes?.eleveurNom, "eleveurNom") &&
      match(device.attributes?.eleveurAdresse, "eleveurAdresse") &&
      match(device.attributes?.espace, "espace") &&
      match(device.attributes?.race, "race") &&
      match(device.attributes?.sexe, "sexe") &&
      match(device.attributes?.dateNaissance, "dateNaissance") &&
      match(device.attributes?.statutReproducteur, "statutReproducteur") &&
      match(device.attributes?.origine, "origine") &&
      match(device.attributes?.status ?? device.attributes?.statut, "status")
    );
  });

  const fetchDevices = useCallback(async () =>
  {
    setLoading(true);
    setError("");
    try
    {
      const endpoint = hasUserFilter
        ? `/api/traccar/devices?userId=${encodeURIComponent(selectedUserId)}`
        : "/api/traccar/devices";

      const response = await fetch(endpoint, { credentials: "include" });
      const data = await response.json() as FullTraccarDevice[] & { message?: string };

      if (!response.ok)
      {
        throw new Error((data as unknown as { message?: string }).message ?? "Erreur lors du chargement");
      }

      setDevices(data);
    }
    catch (err: unknown)
    {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    finally
    {
      setLoading(false);
    }
  }, [hasUserFilter, selectedUserId]);

  useEffect(() => { void fetchDevices(); }, [fetchDevices]);

  const showSuccess = (msg: string) =>
  {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleCreate = () =>
  {
    setSelectedDevice(undefined);
    setView("create");
  };

  const handleEdit = (device: FullTraccarDevice) =>
  {
    setSelectedDevice(device);
    setView("edit");
  };

  const handleFormSuccess = async (savedDevice: FullTraccarDevice) =>
  {
    const isEditing = view === "edit";
    setView("list");
    setSelectedDevice(undefined);
    await fetchDevices();
    showSuccess(isEditing
      ? `Appareil "${savedDevice.name}" mis à jour avec succès.`
      : `Appareil "${savedDevice.name}" créé avec succès.`
    );
  };

  const handleCancel = () =>
  {
    setView("list");
    setSelectedDevice(undefined);
  };

  const handleDelete = async (device: FullTraccarDevice) =>
  {
    if (!confirm(`Supprimer l'appareil "${device.name}" (ID: ${device.id}) ? Cette action est irréversible.`))
    {
      return;
    }

    setDeletingId(device.id);

    try
    {
      const response = await fetch(`/api/traccar/devices/${device.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok)
      {
        const data = await response.json() as { message?: string };
        throw new Error(data.message ?? "Erreur lors de la suppression");
      }

      setDevices(prev => prev.filter(d => d.id !== device.id));
      showSuccess(`Appareil "${device.name}" supprimé.`);
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
      <DeviceForm
        device={selectedDevice}
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

    if (devices.length === 0)
    {
      return (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow">
          Aucun appareil trouvé.&nbsp;<button onClick={handleCreate} className="ml-2 text-blue-600 underline hover:no-underline hover:cursor-pointer">
            Créer le premier
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="md:hidden divide-y divide-gray-100">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters["_global"] ?? ""}
              onChange={e =>
              {
                const v = e.target.value;
                setFilters(v ? { _global: v } : {});
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600" />
          </div>
          {filteredDevices.filter(device =>
          {
            const g = filters["_global"]?.trim().toLowerCase();
            if (!g) return true;
            const all = [
              String(device.id), device.name, device.uniqueId,
              ...Object.values(device.attributes ?? {}),
            ].join(" ").toLowerCase();
            return all.includes(g);
          }).map(device => (
            <div key={device.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400">ID: <span className="font-mono">{device.id}</span></p>
                  <p className="text-base font-semibold text-gray-900 mt-1 wrap-break-word">{device.name}</p>
                  <p className="text-sm text-gray-600 font-mono mt-1 break-all">{device.uniqueId}</p>
                  {device.attributes?.DZId && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">DZId :</span> {device.attributes.DZId}</p>}
                  {device.attributes?.eleveurId && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">N° éleveur :</span> {device.attributes.eleveurId}</p>}
                  {device.attributes?.eleveurNom && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Nom éleveur :</span> {device.attributes.eleveurNom}</p>}
                  {device.attributes?.eleveurAdresse && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Adresse éleveur :</span> {device.attributes.eleveurAdresse}</p>}
                  {device.attributes?.espace && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Espace :</span> {device.attributes.espace}</p>}
                  {device.attributes?.race && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Race :</span> {device.attributes.race}</p>}
                  {device.attributes?.sexe && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Sexe :</span> {device.attributes.sexe}</p>}
                  {device.attributes?.dateNaissance && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Date de naissance :</span> {device.attributes.dateNaissance}</p>}
                  {device.attributes?.statutReproducteur && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Statut reproducteur :</span> {device.attributes.statutReproducteur}</p>}
                  {device.attributes?.origine && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Origine :</span> {device.attributes.origine}</p>}
                  {(device.attributes?.status ?? device.attributes?.statut) && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Statut vaccinal :</span> {device.attributes.status ?? device.attributes.statut}</p>}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(device)}
                  aria-label={`Modifier ${device.name}`}
                  title="Modifier"
                  className="flex-1 text-blue-600 border border-blue-200 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition hover:cursor-pointer flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                  </svg>
                </button>
                <button
                  onClick={() => void handleDelete(device)}
                  disabled={deletingId === device.id}
                  aria-label={`Supprimer ${device.name}`}
                  title="Supprimer"
                  className="flex-1 text-red-600 border border-red-200 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50 hover:cursor-pointer flex items-center justify-center">
                  {deletingId === device.id ? (
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

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Identifiant unique</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">DZId</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">N° éleveur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom éleveur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Adresse éleveur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Espace</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Race</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sexe</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date de naissance</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut reproducteur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Origine</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut vaccinal</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
              <tr className="border-t border-gray-200">
                {([
                  ["id", "ID"],
                  ["name", "Nom"],
                  ["uniqueId", "Identifiant"],
                  ["DZId", "DZId"],
                  ["eleveurId", "N° éleveur"],
                  ["eleveurNom", "Nom éleveur"],
                  ["eleveurAdresse", "Adresse éleveur"],
                  ["espace", "Espace"],
                  ["race", "Race"],
                  ["sexe", "Sexe"],
                  ["dateNaissance", "Date"],
                  ["statutReproducteur", "Statut repr."],
                  ["origine", "Origine"],
                  ["status", "Vaccinal"],
                ] as [string, string][]).map(([key, placeholder]) => (
                  <th key={key} className="px-2 py-2">
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={filters[key] ?? ""}
                      onChange={e => handleFilterChange(key, e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </th>
                ))}
                <th className="px-2 py-2 text-right">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 underline hover:no-underline whitespace-nowrap hover:cursor-pointer">
                      Réinitialiser
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDevices.map(device => (
                <tr key={device.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4 text-gray-400 font-mono">{device.id}</td>
                  <td className="px-4 py-4 font-medium text-gray-900">{device.name}</td>
                  <td className="px-4 py-4 text-gray-600 font-mono">{device.uniqueId}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.DZId ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.eleveurId ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.eleveurNom ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.eleveurAdresse ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.espace ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.race ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.sexe ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.dateNaissance ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.statutReproducteur ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.origine ?? ""}</td>
                  <td className="px-4 py-4 text-gray-600">{device.attributes?.status ?? device.attributes?.statut ?? ""}</td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(device)}
                        aria-label={`Modifier ${device.name}`}
                        title="Modifier"
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition hover:cursor-pointer inline-flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => void handleDelete(device)}
                        disabled={deletingId === device.id}
                        aria-label={`Supprimer ${device.name}`}
                        title="Supprimer"
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50 hover:cursor-pointer inline-flex items-center justify-center">
                        {deletingId === device.id ? (
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
    <div className="max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Gestion des appareils</h1>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition hover:cursor-pointer">
          + Nouvel appareil
        </button>
      </div>

      {hasUserFilter && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>
              {selectedUserName
                ? `Liste de ${selectedUserName}`
                : `Liste de l'utilisateur #${selectedUserId}`}
            </span>
            <Link href="/users" className="font-medium underline hover:no-underline">
              retour aux utilisateurs
            </Link>
            <Link href="/devices" className="font-medium underline hover:no-underline">
              Retirer le filtre
            </Link>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
          <button
            onClick={() => void fetchDevices()}
            className="ml-3 underline hover:no-underline hover:cursor-pointer">
            Réessayer
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
