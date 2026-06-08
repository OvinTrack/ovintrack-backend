"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FullTraccarDevice, FullTraccarUser } from "@/types/traccar-types";
import DeviceForm from "./DeviceForm";

type View = "list" | "create" | "edit";
type AlertPeriod = "1d" | "7d" | "30d";

interface TraccarEventReportItem
{
  type?: string;
  eventType?: string;
  eventTime?: string;
  deviceTime?: string;
  serverTime?: string;
  fixTime?: string;
  attributes?: {
    alarm?: string;
    name?: string;
  };
}

interface AlertDetail
{
  date: string;
  type: string;
  alarmName: string;
}

export default function DeviceList()
{
  const router = useRouter();
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
  const [users, setUsers] = useState<FullTraccarUser[]>([]);
  const [alertsByDeviceId, setAlertsByDeviceId] = useState<Record<number, string>>({});
  const [alertDetailsByDeviceId, setAlertDetailsByDeviceId] = useState<Record<number, AlertDetail[]>>({});
  const [alertPeriod, setAlertPeriod] = useState<AlertPeriod>("7d");
  const [alertsPopupDevice, setAlertsPopupDevice] = useState<FullTraccarDevice | null>(null);

  const usersById = useMemo(() =>
  {
    return new Map(users.map(user => [user.id, user]));
  }, [users]);

  const getOwnerUser = (device: FullTraccarDevice): FullTraccarUser | undefined =>
  {
    const ownerIdRaw = device.attributes?.eleveurId?.trim();
    const ownerId = Number(ownerIdRaw);

    if (!ownerIdRaw || !Number.isInteger(ownerId) || ownerId <= 0)
    {
      return undefined;
    }

    return usersById.get(ownerId);
  };

  const handleFilterChange = (key: string, value: string) =>
  {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters({});

  const hasActiveFilters = Object.values(filters).some(v => v.trim() !== "");

  const formatEventDate = (rawDate?: string): string =>
  {
    if (!rawDate)
    {
      return "Date inconnue";
    }

    const parsed = new Date(rawDate);

    if (Number.isNaN(parsed.getTime()))
    {
      return rawDate;
    }

    return parsed.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  };

  const fetchAlerts = useCallback(async (deviceList: FullTraccarDevice[]) =>
  {
    if (deviceList.length === 0)
    {
      setAlertsByDeviceId({});
      setAlertDetailsByDeviceId({});
      return;
    }

    const now = new Date();
    const periodMsByValue: Record<AlertPeriod, number> = {
      "1d": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    
    const from = new Date(now.getTime() - periodMsByValue[alertPeriod]);
    const fromIso = from.toISOString();
    const toIso = now.toISOString();

    setAlertsByDeviceId(Object.fromEntries(deviceList.map(device => [device.id, "..."])));

    const results = await Promise.allSettled(
      deviceList.map(async (device) =>
      {
        const params = new URLSearchParams({
          deviceId: String(device.id),
          from: fromIso,
          to: toIso,
          type: "alarm",
        });

        const response = await fetch(`/api/traccar/reports/events?${params.toString()}`, {
          credentials: "include",
        });

        if (!response.ok)
        {
          throw new Error("Erreur lors du chargement des alertes");
        }

        const events = await response.json() as TraccarEventReportItem[];
        const alarmEvents = events.filter((event) =>
        {
          const rawType = (event.eventType ?? event.type ?? "").trim().toLowerCase();
          return rawType === "alarm" || rawType === "alarme";
        });

        const details: AlertDetail[] = alarmEvents.map((event) =>
        {
          const dateRaw = event.eventTime ?? event.deviceTime ?? event.serverTime ?? event.fixTime;
          const typeRaw = (event.eventType ?? event.type ?? "inconnu").trim();
          const alarmNameRaw = (event.attributes?.alarm ?? event.attributes?.name ?? "").trim();

          return {
            date: formatEventDate(dateRaw),
            type: typeRaw || "inconnu",
            alarmName: alarmNameRaw || "Alarme inconnue",
          };
        });

        return {
          deviceId: device.id,
          value: String(alarmEvents.length),
          details,
        };
      }),
    );

    setAlertsByDeviceId((prev) =>
    {
      const next = { ...prev };

      results.forEach((result, index) =>
      {
        const deviceId = deviceList[index]?.id;

        if (!deviceId)
        {
          return;
        }

        if (result.status === "fulfilled")
        {
          next[deviceId] = result.value.value;
          return;
        }

        next[deviceId] = "N/A";
      });

      return next;
    });

    setAlertDetailsByDeviceId((prev) =>
    {
      const next = { ...prev };

      results.forEach((result, index) =>
      {
        const deviceId = deviceList[index]?.id;

        if (!deviceId)
        {
          return;
        }

        if (result.status === "fulfilled")
        {
          next[deviceId] = result.value.details;
          return;
        }

        next[deviceId] = [];
      });

      return next;
    });
  }, [alertPeriod]);

  const renderAlertsValue = (device: FullTraccarDevice) =>
  {
    const value = alertsByDeviceId[device.id] ?? "...";
    const count = Number(value);

    if (Number.isInteger(count) && count > 0)
    {
      return (
        <button
          type="button"
          onClick={() => setAlertsPopupDevice(device)}
          className="text-blue-600 underline hover:no-underline hover:cursor-pointer"
          title={`Voir les ${count} alertes de ${device.name}`}>
          {count}
        </button>
      );
    }

    return value;
  };

  const filteredDevices = devices.filter(device =>
  {
    const ownerUser = getOwnerUser(device);

    const match = (value: string | undefined, key: string) =>
    {
      const f = filters[key]?.trim().toLowerCase();

      if (!f) return true;

      const normalizedValue = (value ?? "").trim().toLowerCase();

      if (key === "sexe" || key === "status" || key === "statutReproducteur")
      {
        return normalizedValue === f;
      }

      return normalizedValue.includes(f);
    };

    return (
      match(String(device.id), "id") &&
      match(device.name, "name") &&
      match(device.uniqueId, "uniqueId") &&
      match(alertsByDeviceId[device.id], "alertes") &&
      match(device.attributes?.DZId, "DZId") &&
      match(ownerUser?.attributes?.eleveurNumNational, "eleveurNumNational") &&
      match(ownerUser?.name, "eleveurNom") &&
      match(ownerUser?.attributes?.eleveurAdresse, "eleveurAdresse") &&
      match(device.attributes?.espace, "espace") &&
      match(device.attributes?.race, "race") &&
      match(device.attributes?.sexe, "sexe") &&
      match(device.attributes?.dateNaissance, "dateNaissance") &&
      match(ownerUser?.attributes?.statutReproducteur, "statutReproducteur") &&
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

      const usersResponse = await fetch("/api/traccar/users", { credentials: "include" });
      if (usersResponse.ok)
      {
        setUsers(await usersResponse.json() as FullTraccarUser[]);
      }
      else
      {
        setUsers([]);
      }
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

  useEffect(() =>
  {
    queueMicrotask(() => { void fetchDevices(); });
  }, [fetchDevices]);

  useEffect(() =>
  {
    if (devices.length === 0)
    {
      return;
    }

    queueMicrotask(() => { void fetchAlerts(devices); });
  }, [alertPeriod, devices, fetchAlerts]);

  useEffect(() =>
  {
    if (!alertsPopupDevice)
    {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) =>
    {
      if (event.key === "Escape")
      {
        setAlertsPopupDevice(null);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);

    return () =>
    {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [alertsPopupDevice]);

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

  const handleVisualize = (device: FullTraccarDevice) =>
  {
    const params = new URLSearchParams({ deviceId: String(device.id) });

    if (hasUserFilter)
    {
      params.set("userId", selectedUserId);
    }

    if (selectedUserName)
    {
      params.set("userName", selectedUserName);
    }

    router.push(`/?${params.toString()}`);
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
      setAlertsByDeviceId(prev =>
      {
        const next = { ...prev };
        delete next[device.id];
        return next;
      });
      setAlertDetailsByDeviceId(prev =>
      {
        const next = { ...prev };
        delete next[device.id];
        return next;
      });
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

  const renderColumnFilter = (key: string, placeholder: string) =>
  {
    if (key === "sexe")
    {
      return (
        <select
          aria-label="Filtrer par sexe"
          title="Filtrer par sexe"
          value={filters[key] ?? ""}
          onChange={e => handleFilterChange(key, e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
          <option value="">Sexe</option>
          <option value="male">Male</option>
          <option value="femelle">Femelle</option>
        </select>
      );
    }

    if (key === "status")
    {
      return (
        <select
          aria-label="Filtrer par statut vaccinal"
          title="Filtrer par statut vaccinal"
          value={filters[key] ?? ""}
          onChange={e => handleFilterChange(key, e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
          <option value="">Statut vaccinal</option>
          <option value="vacciné">Vacciné</option>
          <option value="non vacciné">Non Vacciné</option>
        </select>
      );
    }

    if (key === "statutReproducteur")
    {
      return (
        <select
          aria-label="Filtrer par statut reproducteur"
          title="Filtrer par statut reproducteur"
          value={filters[key] ?? ""}
          onChange={e => handleFilterChange(key, e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
          <option value="">Statut reproducteur</option>
          <option value="géniteur">Géniteur</option>
          <option value="non géniteur">Non Géniteur</option>
        </select>
      );
    }

    return (
      <input
        type="text"
        placeholder={placeholder}
        value={filters[key] ?? ""}
        onChange={e => handleFilterChange(key, e.target.value)}
        className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-normal text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400" />
    );
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
        <div className="lg:hidden divide-y divide-gray-100">
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
              alertsByDeviceId[device.id] ?? "",
              ...Object.values(device.attributes ?? {}),
            ].join(" ").toLowerCase();
            return all.includes(g);
          }).map(device =>
          {
            const ownerUser = getOwnerUser(device);

            return (
              <div key={device.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-400">ID: <span className="font-mono">{device.id}</span></p>
                    <p className="text-base font-semibold text-gray-900 mt-1 wrap-break-word">{device.name}</p>
                    <p className="text-sm text-gray-600 font-mono mt-1 break-all">{device.uniqueId}</p>
                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Alertes :</span> {renderAlertsValue(device)}</p>
                    {device.attributes?.DZId && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">DZId :</span> {device.attributes.DZId}</p>}
                    {ownerUser?.attributes?.eleveurNumNational && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">N° éleveur :</span> {ownerUser.attributes.eleveurNumNational}</p>}
                    {ownerUser?.name && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Nom éleveur :</span> {ownerUser.name}</p>}
                    {ownerUser?.attributes?.eleveurAdresse && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Adresse éleveur :</span> {ownerUser.attributes.eleveurAdresse}</p>}
                    {device.attributes?.espace && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Espace :</span> {device.attributes.espace}</p>}
                    {device.attributes?.race && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Race :</span> {device.attributes.race}</p>}
                    {device.attributes?.sexe && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Sexe :</span> {device.attributes.sexe}</p>}
                    {device.attributes?.dateNaissance && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Date de naissance :</span> {device.attributes.dateNaissance}</p>}
                    {ownerUser?.attributes?.statutReproducteur && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Statut reproducteur :</span> {ownerUser.attributes.statutReproducteur}</p>}
                    {device.attributes?.origine && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Origine :</span> {device.attributes.origine}</p>}
                    {(device.attributes?.status ?? device.attributes?.statut) && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Statut vaccinal :</span> {device.attributes.status ?? device.attributes.statut}</p>}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleVisualize(device)}
                    aria-label={`Visualiser ${device.name}`}
                    title="Visualiser"
                    className="flex-1 text-emerald-600 border border-emerald-200 hover:text-emerald-800 px-3 py-2 rounded-lg hover:bg-emerald-50 transition hover:cursor-pointer flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
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
            );
          })}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Identifiant unique</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Alertes</th>
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
                  ["alertes", "Alertes"],
                  ["DZId", "DZId"],
                  ["eleveurNumNational", "N° éleveur"],
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
                    {renderColumnFilter(key, placeholder)}
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
              {filteredDevices.map(device =>
              {
                const ownerUser = getOwnerUser(device);

                return (
                  <tr key={device.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4 text-gray-400 font-mono">{device.id}</td>
                    <td className="px-4 py-4 font-medium text-gray-900">{device.name}</td>
                    <td className="px-4 py-4 text-gray-600 font-mono">{device.uniqueId}</td>
                    <td className="px-4 py-4 text-gray-600">{renderAlertsValue(device)}</td>
                    <td className="px-4 py-4 text-gray-600">{device.attributes?.DZId ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{ownerUser?.attributes?.eleveurNumNational ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{ownerUser?.name ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{ownerUser?.attributes?.eleveurAdresse ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{device.attributes?.espace ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{device.attributes?.race ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{device.attributes?.sexe ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{device.attributes?.dateNaissance ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{ownerUser?.attributes?.statutReproducteur ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{device.attributes?.origine ?? ""}</td>
                    <td className="px-4 py-4 text-gray-600">{device.attributes?.status ?? device.attributes?.statut ?? ""}</td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleVisualize(device)}
                          aria-label={`Visualiser ${device.name}`}
                          title="Visualiser"
                          className="text-emerald-600 hover:text-emerald-800 px-3 py-1 rounded-lg hover:bg-emerald-50 transition hover:cursor-pointer inline-flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
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
                );
              })}
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
        <div className="flex items-center gap-2">
          <label htmlFor="alerts-period" className="text-sm text-black dark:text-white">Alertes sur</label>
          <select
            id="alerts-period"
            value={alertPeriod}
            onChange={e => setAlertPeriod(e.target.value as AlertPeriod)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="1d">24 heures</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition hover:cursor-pointer">
            + Nouvel appareil
          </button>
        </div>
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

      {alertsPopupDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer la popup des alertes"
            className="absolute inset-0 bg-black/40"
            onClick={() => setAlertsPopupDevice(null)}
          />

          <dialog
            open
            aria-label={`Détail des alertes pour ${alertsPopupDevice.name}`}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-0 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Alertes de {alertsPopupDevice.name}
              </h2>
              <button
                type="button"
                onClick={() => setAlertsPopupDevice(null)}
                className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:cursor-pointer"
                aria-label="Fermer la popup des alertes">
                Fermer
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {(alertDetailsByDeviceId[alertsPopupDevice.id] ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">Aucune alerte disponible.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(alertDetailsByDeviceId[alertsPopupDevice.id] ?? []).map((alert, index) => (
                    <div key={`${alertsPopupDevice.id}-${index}`} className="grid grid-cols-1 gap-1 py-2 text-sm text-gray-700 sm:grid-cols-[220px_1fr]">
                      <span className="font-medium text-gray-900">{alert.date}</span>
                      <div className="flex flex-col">
                        <span>{alert.alarmName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
