"use client";

import { useState } from "react";
import type { FullTraccarDevice, TraccarDevice } from "@/types/traccar-types";

interface DeviceFormProps
{
  device?: FullTraccarDevice;
  onSuccess: (device: FullTraccarDevice) => void;
  onCancel: () => void;
}

interface ApiErrorResponse
{
  message?: string;
  details?: unknown;
}

function isGenericTraccarRequestErrorMessage(value: string | undefined): boolean
{
  if (!value)
  {
    return false;
  }

  return /^Traccar(?: admin)? request failed \(\d+\)$/i.test(value.trim());
}

function getDetailsErrorMessage(details: unknown): string | undefined
{
  if (typeof details === "string")
  {
    return details.trim() || undefined;
  }

  if (details && typeof details === "object")
  {
    try
    {
      const serialized = JSON.stringify(details);
      return serialized === "{}" ? undefined : serialized;
    }
    catch
    {
      return undefined;
    }
  }

  return undefined;
}

interface DeviceFormData
{
  name: string;
  uniqueId: string;
  DZId: string;
  eleveurId: string;
  espace: string;
  race: string;
  sexe: string;
  dateNaissance: string;
  statutReproducteur: string;
  origine: string;
  status: string;
}

function normalizeUniqueId(value: string): string
{
  return value.trim().toLowerCase();
}

function buildAttributes(formData: DeviceFormData, baseAttributes: Record<string, string>): Record<string, string>
{
  const attributes: Record<string, string> = { ...baseAttributes };

  const fieldMappings: Array<[keyof DeviceFormData, string]> = [
    ["DZId", "DZId"],
    ["eleveurId", "eleveurId"],
    ["espace", "espace"],
    ["race", "race"],
    ["sexe", "sexe"],
    ["dateNaissance", "dateNaissance"],
    ["statutReproducteur", "statutReproducteur"],
    ["origine", "origine"],
  ];

  for (const [formKey, attributeKey] of fieldMappings)
  {
    const value = formData[formKey].trim();

    if (value)
    {
      attributes[attributeKey] = value;
      continue;
    }

    delete attributes[attributeKey];
  }

  const statusValue = formData.status.trim();

  if (statusValue)
  {
    attributes.status = statusValue;
  }
  else
  {
    delete attributes.status;
    delete attributes.statut;
  }

  return attributes;
}

export default function DeviceForm({ device, onSuccess, onCancel }: Readonly<DeviceFormProps>)
{
  const isEditing = device !== undefined;

  const [formData, setFormData] = useState({
    name: device?.name ?? "",
    uniqueId: device?.uniqueId ?? "",
    DZId: device?.attributes?.DZId ?? "",
    eleveurId: device?.attributes?.eleveurId ?? "",
    espace: device?.attributes?.espace ?? "",
    race: device?.attributes?.race ?? "",
    sexe: device?.attributes?.sexe ?? "",
    dateNaissance: device?.attributes?.dateNaissance ?? "",
    statutReproducteur: device?.attributes?.statutReproducteur ?? "",
    origine: device?.attributes?.origine ?? "",
    status: device?.attributes?.status ?? device?.attributes?.statut ?? "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uniqueIdMessage, setUniqueIdMessage] = useState("");
  const [isCheckingUniqueId, setIsCheckingUniqueId] = useState(false);
  const [isUniqueIdAvailable, setIsUniqueIdAvailable] = useState<boolean | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  {
    const { name, value } = e.target;

    if (name === "uniqueId")
    {
      setUniqueIdMessage("");
      setIsCheckingUniqueId(false);
      setIsUniqueIdAvailable(null);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const failSubmission = (errorMessage: string) =>
  {
    setMessage(`Erreur : ${errorMessage}`);
    setLoading(false);
  };

  const getRequiredFieldError = (): string | null =>
  {
    if (!formData.name.trim())
    {
      return "Le nom est requis.";
    }

    if (!formData.uniqueId.trim())
    {
      return "L'identifiant unique est requis.";
    }

    return null;
  };

  const getDuplicateUniqueIdError = async (normalizedUniqueId: string): Promise<string | null> =>
  {
    const devicesResponse = await fetch("/api/traccar/devices", {
      method: "GET",
      credentials: "include",
    });

    if (!devicesResponse.ok)
    {
      return "Impossible de verifier l'unicite de l'identifiant unique.";
    }

    const devices = await devicesResponse.json() as TraccarDevice[];
    const duplicateDevice = devices.find((existingDevice) =>
      normalizeUniqueId(existingDevice.uniqueId) === normalizedUniqueId
      && (!isEditing || existingDevice.id !== device.id),
    );

    if (duplicateDevice)
    {
      return "Un appareil existe deja avec cet identifiant unique.";
    }

    return null;
  };

  const handleUniqueIdBlur = async () =>
  {
    const normalizedUniqueId = normalizeUniqueId(formData.uniqueId);

    if (!normalizedUniqueId)
    {
      setUniqueIdMessage("");
      setIsUniqueIdAvailable(null);
      return;
    }

    setIsCheckingUniqueId(true);
    setUniqueIdMessage("");

    const duplicateUniqueIdError = await getDuplicateUniqueIdError(normalizedUniqueId);

    if (!duplicateUniqueIdError)
    {
      setIsUniqueIdAvailable(true);
      setUniqueIdMessage("Identifiant unique disponible.");
      setIsCheckingUniqueId(false);
      return;
    }

    setIsUniqueIdAvailable(false);
    setUniqueIdMessage(duplicateUniqueIdError);
    setIsCheckingUniqueId(false);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) =>
  {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const requiredFieldError = getRequiredFieldError();

    if (requiredFieldError)
    {
      failSubmission(requiredFieldError);
      return;
    }

    const normalizedUniqueId = normalizeUniqueId(formData.uniqueId);

    const duplicateUniqueIdError = await getDuplicateUniqueIdError(normalizedUniqueId);

    if (duplicateUniqueIdError)
    {
      failSubmission(duplicateUniqueIdError);
      return;
    }

    const attributes = buildAttributes(formData, device?.attributes ?? {});

    const payload = {
      name: formData.name.trim(),
      uniqueId: formData.uniqueId.trim(),
      ...(Object.keys(attributes).length > 0 && { attributes }),
    };

    try
    {
      const url = isEditing
        ? `/api/traccar/devices/${device.id}`
        : "/api/traccar/devices";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") ?? "";
      let data: (FullTraccarDevice & ApiErrorResponse) | null = null;

      if (contentType.includes("application/json"))
      {
        data = await response.json() as FullTraccarDevice & ApiErrorResponse;
      }

      if (!response.ok)
      {
        const detailsMessage = getDetailsErrorMessage(data?.details);
        const message = isGenericTraccarRequestErrorMessage(data?.message) && detailsMessage
          ? detailsMessage
          : data?.message;

        const fallbackMessage = `La requete a echoue (HTTP ${response.status}).`;

        throw new Error(message ?? detailsMessage ?? fallbackMessage);
      }

      if (!data)
      {
        throw new Error("La reponse du serveur est invalide.");
      }

      onSuccess(data);
    }
    catch (error: unknown)
    {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setMessage(`Erreur : ${errorMessage}`);
    }
    finally
    {
      setLoading(false);
    }
  };

  let btnLabel = "Créer";

  if (loading)
  {
    btnLabel = "Envoi...";
  }
  else if (isEditing)
  {
    btnLabel = "Mettre à jour";
  }

  const input =
    "w-full rounded-xl border border-gray-300 text-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const uniqueIdInputClass = [
    input,
    isUniqueIdAvailable === true ? "border-green-500 focus:ring-green-500" : "",
    isUniqueIdAvailable === false ? "border-red-500 focus:ring-red-500" : "",
  ].join(" ").trim();

  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-lg mx-auto p-8 bg-white shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-700">
        {isEditing ? "Modifier l'appareil" : "Créer un appareil"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={label}>Nom <span className="text-red-500">*</span></label>
          <input
            id="name"
            className={input}
            name="name"
            placeholder="Nom de l'appareil"
            value={formData.name}
            onChange={handleChange}
            required />
        </div>

        <div>
          <label htmlFor="uniqueId" className={label}>Identifiant unique <span className="text-red-500">*</span></label>
          <input
            id="uniqueId"
            className={uniqueIdInputClass}
            name="uniqueId"
            placeholder="IMEI ou identifiant unique"
            value={formData.uniqueId}
            onChange={handleChange}
            onBlur={handleUniqueIdBlur}
            required />
          {isCheckingUniqueId && (
            <p className="mt-1 text-xs text-gray-500">Verification de l&apos;identifiant...</p>
          )}
          {!isCheckingUniqueId && uniqueIdMessage && (
            <p className={`mt-1 text-xs ${isUniqueIdAvailable ? "text-green-600" : "text-red-600"}`}>
              {uniqueIdMessage}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="DZId" className={label}>DZId</label>
          <input
            id="DZId"
            className={input}
            name="DZId"
            placeholder="DZId"
            value={formData.DZId}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="eleveurId" className={label}>Numéro national de l&apos;éleveur</label>
          <input
            id="eleveurId"
            className={input}
            name="eleveurId"
            placeholder="Numéro national éleveur"
            value={formData.eleveurId}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="espace" className={label}>Espace</label>
          <input
            id="espace"
            className={input}
            name="espace"
            placeholder="Espace"
            value={formData.espace}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="race" className={label}>Race</label>
          <input
            id="race"
            className={input}
            name="race"
            placeholder="Race"
            value={formData.race}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="sexe" className={label}>Sexe</label>
          <input
            id="sexe"
            className={input}
            name="sexe"
            placeholder="Mâle / Femelle"
            value={formData.sexe}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="dateNaissance" className={label}>Date de naissance</label>
          <input
            id="dateNaissance"
            className={input}
            type="date"
            name="dateNaissance"
            value={formData.dateNaissance}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="statutReproducteur" className={label}>Statut reproducteur</label>
          <input
            id="statutReproducteur"
            className={input}
            name="statutReproducteur"
            placeholder="Géniteur / Non géniteur"
            value={formData.statutReproducteur}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="origine" className={label}>Origine</label>
          <input
            id="origine"
            className={input}
            name="origine"
            placeholder="Origine"
            value={formData.origine}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="status" className={label}>Statut vaccinal</label>
          <input
            id="status"
            className={input}
            name="status"
            placeholder="Vacciné / Non vacciné"
            value={formData.status}
            onChange={handleChange}
          />
        </div>

        {message && (
          <p className={`text-sm text-center ${message.startsWith("Erreur") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
            {btnLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
