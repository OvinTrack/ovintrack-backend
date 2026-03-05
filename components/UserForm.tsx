"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"
import { FullTraccarUser } from "@/types/traccar-types";

export default function UserForm()
{
  const [formData, setFormData] = useState<FullTraccarUser>({
    id: 6,
    name: "",
    email: "",
    phone: "",
    readonly: true,
    administrator: false,
    map: "string",
    latitude: 0,
    longitude: 0,
    zoom: 0,
    password: "string",
    coordinateFormat: "string",
    disabled: true,
    expirationTime: "2019-08-24T14:15",
    deviceLimit: 0,
    userLimit: 0,
    deviceReadonly: true,
    limitCommands: true,
    fixedEmail: true,
    poiLayer: "string",
    attributes: {}
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    const { name, value, type, checked } = e.target;

    let fieldValue: string | number | boolean;

    if (type === "checkbox")
    {
      fieldValue = checked;
    }
    else if (type === "number")
    {
      fieldValue = Number(value);
    }
    else
    {
      fieldValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) =>
  {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try
    {
      const response = await fetch("/api/traccar/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok)
      {
        throw new Error(data.message || "Erreur inconnue");;
      }

      setMessage("Utilisateur enregistré avec succès.");
      router.push("/api/traccar/users");
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

  const input =
    "w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-semibold mb-8 text-center">
        Création d&apos;un utilisateur
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Informations principales */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Informations</h3>

          <div>
            <label htmlFor="id" className={label}>ID</label>
            <input id="id" className={input} type="number" name="id" placeholder="Entrez l'ID" value={formData.id} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="name" className={label}>Nom</label>
            <input id="name" className={input} name="name" placeholder="Entrez le nom" value={formData.name} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" className={input} name="email" placeholder="Entrez l'email" value={formData.email} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="phone" className={label}>Téléphone</label>
            <input id="phone" className={input} name="phone" placeholder="Entrez le téléphone" value={formData.phone} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="password" className={label}>Mot de passe</label>
            <input id="password" className={input} type="password" name="password" placeholder="Entrez le mot de passe" value={formData.password} onChange={handleChange} />
          </div>
        </section>

        {/* Localisation */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Localisation</h3>

          <div>
            <label htmlFor="map" className={label}>Map</label>
            <input id="map" className={input} name="map" placeholder="Entrez la carte" value={formData.map} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="latitude" className={label}>Latitude</label>
            <input id="latitude" className={input} type="number" name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="longitude" className={label}>Longitude</label>
            <input id="longitude" className={input} type="number" name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="zoom" className={label}>Zoom</label>
            <input id="zoom" className={input} type="number" name="zoom" placeholder="Niveau de zoom" value={formData.zoom} onChange={handleChange} />
          </div>
        </section>

        {/* Configuration */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Configuration</h3>

          <div>
            <label htmlFor="coordinateFormat" className={label}>Format des coordonnées</label>
            <input id="coordinateFormat" className={input} name="coordinateFormat" placeholder="Format des coordonnées" value={formData.coordinateFormat} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="expirationTime" className={label}>Date d&apos;expiration</label>
            <input
              id="expirationTime"
              className={input}
              type="datetime-local"
              name="expirationTime"
              placeholder="Date d'expiration"
              value={formData.expirationTime}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="poiLayer" className={label}>POI Layer</label>
            <input id="poiLayer" className={input} name="poiLayer" placeholder="POI Layer" value={formData.poiLayer} onChange={handleChange} />
          </div>
        </section>

        {/* Limites */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Limites</h3>

          <div>
            <label htmlFor="deviceLimit" className={label}>Limite d&apos;appareils</label>
            <input id="deviceLimit" className={input} type="number" name="deviceLimit" placeholder="Limite d'appareils" value={formData.deviceLimit} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="userLimit" className={label}>Limite d&apos;utilisateurs</label>
            <input id="userLimit" className={input} type="number" name="userLimit" placeholder="Limite d'utilisateurs" value={formData.userLimit} onChange={handleChange} />
          </div>
        </section>

        {/* Permissions */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Permissions</h3>

          {[
            { key: "readonly", label: "Lecture seule" },
            { key: "administrator", label: "Administrateur" },
            { key: "disabled", label: "Désactivé" },
            { key: "deviceReadonly", label: "Appareils en lecture seule" },
            { key: "limitCommands", label: "Limiter les commandes" },
            { key: "fixedEmail", label: "Email fixe" }
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3">
              <input
                type="checkbox"
                name={item.key}
                checked={Boolean(formData[item.key as keyof FullTraccarUser])}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Envoi..." : "Enregistrer"}
        </button>

        {message && (
          <p className="text-center text-sm mt-4">{message}</p>
        )}
      </form>
    </div>
  );
}
