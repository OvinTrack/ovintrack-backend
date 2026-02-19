"use client";

import { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  readonly: boolean;
  administrator: boolean;
  map: string;
  latitude: number;
  longitude: number;
  zoom: number;
  password: string;
  coordinateFormat: string;
  disabled: boolean;
  expirationTime: string;
  deviceLimit: number;
  userLimit: number;
  deviceReadonly: boolean;
  limitCommands: boolean;
  fixedEmail: boolean;
  poiLayer: string;
  attributes: Record<string, string>;
}

export default function UserForm() {
  const [formData, setFormData] = useState<User>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/traccar/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

	const data = await response.json();

	if (!response.ok) {
	    throw new Error(data.message || "Erreur inconnue");;
	}
      setMessage("Utilisateur enregistré avec succès.");
    } catch (error: any) {
      setMessage(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-semibold mb-8 text-center">
        Création d'un utilisateur
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Informations principales */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Informations</h3>

          <div>
            <label className={label}>ID</label>
            <input className={input} type="number" name="id" value={formData.id} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Nom</label>
            <input className={input} name="name" value={formData.name} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Email</label>
            <input className={input} name="email" value={formData.email} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Téléphone</label>
            <input className={input} name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Mot de passe</label>
            <input className={input} type="password" name="password" value={formData.password} onChange={handleChange} />
          </div>
        </section>

        {/* Localisation */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Localisation</h3>

          <div>
            <label className={label}>Map</label>
            <input className={input} name="map" value={formData.map} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Latitude</label>
            <input className={input} type="number" name="latitude" value={formData.latitude} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Longitude</label>
            <input className={input} type="number" name="longitude" value={formData.longitude} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Zoom</label>
            <input className={input} type="number" name="zoom" value={formData.zoom} onChange={handleChange} />
          </div>
        </section>

        {/* Configuration */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Configuration</h3>

          <div>
            <label className={label}>Format des coordonnées</label>
            <input className={input} name="coordinateFormat" value={formData.coordinateFormat} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Date d'expiration</label>
            <input
              className={input}
              type="datetime-local"
              name="expirationTime"
              value={formData.expirationTime}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className={label}>POI Layer</label>
            <input className={input} name="poiLayer" value={formData.poiLayer} onChange={handleChange} />
          </div>
        </section>

        {/* Limites */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Limites</h3>

          <div>
            <label className={label}>Limite d'appareils</label>
            <input className={input} type="number" name="deviceLimit" value={formData.deviceLimit} onChange={handleChange} />
          </div>

          <div>
            <label className={label}>Limite d'utilisateurs</label>
            <input className={input} type="number" name="userLimit" value={formData.userLimit} onChange={handleChange} />
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
                checked={(formData as any)[item.key]}
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
