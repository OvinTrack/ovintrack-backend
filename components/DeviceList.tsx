"use client";

import { useEffect, useState } from "react";
import type { FullTraccarDevice } from "@/types/traccar-types";
import DeviceForm from "./DeviceForm";

type View = "list" | "create" | "edit";

export default function DeviceList()
{
  const [devices, setDevices] = useState<FullTraccarDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [view, setView] = useState<View>("list");
  const [selectedDevice, setSelectedDevice] = useState<FullTraccarDevice | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDevices = async () =>
  {
    setLoading(true);
    setError("");
    try
    {
      const response = await fetch("/api/traccar/devices", { credentials: "include" });
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
  };

  useEffect(() => { void fetchDevices(); }, []);

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
        onCancel={handleCancel}
      />
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
          Aucun appareil trouvé.&nbsp;<button onClick={handleCreate} className="ml-2 text-blue-600 underline hover:no-underline">
            Créer le premier
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="md:hidden divide-y divide-gray-100">
          {devices.map(device => (
            <div key={device.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400">ID: <span className="font-mono">{device.id}</span></p>
                  <p className="text-base font-semibold text-gray-900 mt-1 wrap-break-word">{device.name}</p>
                  <p className="text-sm text-gray-600 font-mono mt-1 break-all">{device.uniqueId}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(device)}
                  className="flex-1 text-blue-600 border border-blue-200 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  Modifier
                </button>
                <button
                  onClick={() => void handleDelete(device)}
                  disabled={deletingId === device.id}
                  className="flex-1 text-red-600 border border-red-200 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  {deletingId === device.id ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">ID</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Nom</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Identifiant unique</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map(device => (
                <tr key={device.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-400 font-mono">{device.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{device.name}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{device.uniqueId}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(device)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition">
                      Modifier
                    </button>
                    <button
                      onClick={() => void handleDelete(device)}
                      disabled={deletingId === device.id}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                      {deletingId === device.id ? "Suppression..." : "Supprimer"}
                    </button>
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Gestion des appareils</h1>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">
          + Nouvel appareil
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
            onClick={() => void fetchDevices()}
            className="ml-3 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
