"use client";

import { useState } from "react";
import type { FullTraccarDevice } from "@/types/traccar-types";

interface DeviceFormProps
{
  device?: FullTraccarDevice;
  onSuccess: (device: FullTraccarDevice) => void;
  onCancel: () => void;
}

export default function DeviceForm({ device, onSuccess, onCancel }: Readonly<DeviceFormProps>)
{
  const isEditing = device !== undefined;

  const [formData, setFormData] = useState({
    name: device?.name ?? "",
    uniqueId: device?.uniqueId ?? "",
    attributes: device?.attributes ? JSON.stringify(device.attributes, null, 2) : "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) =>
  {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!formData.name.trim())
    {
      setMessage("Erreur : Le nom est requis.");
      setLoading(false);
      return;
    }

    if (!formData.uniqueId.trim())
    {
      setMessage("Erreur : L'identifiant unique est requis.");
      setLoading(false);
      return;
    }

    let attributes: Record<string, string> | undefined;

    if (formData.attributes.trim())
    {
      try
      {
        attributes = JSON.parse(formData.attributes) as Record<string, string>;
      }
      catch
      {
        setMessage("Erreur : Les attributs doivent être un JSON valide.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      uniqueId: formData.uniqueId.trim(),
      ...(attributes !== undefined && { attributes }),
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

      const data = await response.json() as FullTraccarDevice & { message?: string };

      if (!response.ok)
      {
        throw new Error(data.message ?? "Erreur inconnue");
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
            className={input}
            name="uniqueId"
            placeholder="IMEI ou identifiant unique"
            value={formData.uniqueId}
            onChange={handleChange}
            required />
        </div>

        <div>
          <label htmlFor="attributes" className={label}>
            Attributs <span className="text-gray-400 font-normal">(JSON optionnel)</span>
          </label>
          <textarea
            id="attributes"
            className={`${input} font-mono text-sm resize-y min-h-20`}
            name="attributes"
            placeholder='{"clé": "valeur"}'
            value={formData.attributes}
            onChange={handleChange}
            rows={3} />
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
