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

    const DZId = formData.DZId.trim();
    const eleveurId = formData.eleveurId.trim();
    const espace = formData.espace.trim();
    const race = formData.race.trim();
    const sexe = formData.sexe.trim();
    const dateNaissance = formData.dateNaissance.trim();
    const statutReproducteur = formData.statutReproducteur.trim();
    const origine = formData.origine.trim();
    const status = formData.status.trim();

    const baseAttributes = device?.attributes ?? {};
    const attributes: Record<string, string> = {
      ...baseAttributes,
      ...(DZId && { DZId }),
      ...(eleveurId && { eleveurId }),
      ...(espace && { espace }),
      ...(race && { race }),
      ...(sexe && { sexe }),
      ...(dateNaissance && { dateNaissance }),
      ...(statutReproducteur && { statutReproducteur }),
      ...(origine && { origine }),
      ...(status && { status }),
    };

    // Avoid sending stale keys if user clears a field.
    if (!DZId) delete attributes.DZId;
    if (!eleveurId) delete attributes.eleveurId;
    if (!espace) delete attributes.espace;
    if (!race) delete attributes.race;
    if (!sexe) delete attributes.sexe;
    if (!dateNaissance) delete attributes.dateNaissance;
    if (!statutReproducteur) delete attributes.statutReproducteur;
    if (!origine) delete attributes.origine;
    if (!status)
    {
      delete attributes.status;
      delete attributes.statut;
    }

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
