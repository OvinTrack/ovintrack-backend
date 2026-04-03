"use client";

import { useState } from "react";
import type { FullTraccarUser } from "@/types/traccar-types";

interface UserFormProps
{
  user?: FullTraccarUser;
  onSuccess: (user: FullTraccarUser) => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: Readonly<UserFormProps>)
{
  const isEditing = user !== undefined;

  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    phone: user?.phone ?? "",
    administrator: user?.administrator ?? false,
    disabled: user?.disabled ?? false,
    deviceLimit: user?.deviceLimit ?? -1,
    userLimit: user?.userLimit ?? 0,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    const { name, value, type, checked } = e.target;
    let fieldValue: string | number | boolean;
    if (type === "checkbox") fieldValue = checked;
    else if (type === "number") fieldValue = Number(value);
    else fieldValue = value;

    setFormData(prev => ({ ...prev, [name]: fieldValue }));
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

    if (!formData.email.trim())
    {
      setMessage("Erreur : L'email est requis.");
      setLoading(false);
      return;
    }

    if (!isEditing && !formData.password.trim())
    {
      setMessage("Erreur : Le mot de passe est requis.");
      setLoading(false);
      return;
    }

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      administrator: formData.administrator,
      disabled: formData.disabled,
      deviceLimit: formData.deviceLimit,
      userLimit: formData.userLimit,
    };

    // N'envoie le mot de passe que si renseigné (obligatoire à la création, optionnel en édition)
    if (formData.password.trim())
    {
      payload.password = formData.password.trim();
    }

    try
    {
      const url = isEditing ? `/api/traccar/users/${user.id}` : "/api/traccar/users";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json() as FullTraccarUser & { message?: string };

      if (!response.ok)
      {
        throw new Error(data.message ?? "Erreur inconnue");
      }

      onSuccess(data);
    }
    catch (error: unknown)
    {
      setMessage(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
    finally
    {
      setLoading(false);
    }
  };

  let btnLabel = "Créer";
  if (loading) btnLabel = "Envoi...";
  else if (isEditing) btnLabel = "Mettre à jour";

  const input =
    "w-full rounded-xl border border-gray-300 text-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-lg mx-auto p-8 bg-white shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-700">
        {isEditing ? "Modifier l'utilisateur" : "Créer un utilisateur"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={label}>Nom <span className="text-red-500">*</span></label>
          <input
            id="name"
            className={input}
            name="name"
            placeholder="Nom complet"
            value={formData.name}
            onChange={handleChange}
            required />
        </div>

        <div>
          <label htmlFor="email" className={label}>Email <span className="text-red-500">*</span></label>
          <input
            id="email"
            className={input}
            type="email"
            name="email"
            placeholder="adresse@exemple.com"
            value={formData.email}
            onChange={handleChange}
            required />
        </div>

        <div>
          <label htmlFor="password" className={label}>
            Mot de passe {!isEditing && <span className="text-red-500">*</span>}
            {isEditing && (
              <span className="text-gray-400 font-normal"> (laisser vide pour conserver l&apos;actuel)</span>
            )}
          </label>
          <input
            id="password"
            className={input}
            type="password"
            name="password"
            placeholder={isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password" />
        </div>

        <div>
          <label htmlFor="phone" className={label}>Téléphone</label>
          <input
            id="phone"
            className={input}
            name="phone"
            placeholder="+33..."
            value={formData.phone}
            onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="deviceLimit" className={label}>Limite d&apos;appareils</label>
            <input
              id="deviceLimit"
              className={input}
              type="number"
              name="deviceLimit"
              value={formData.deviceLimit}
              onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="userLimit" className={label}>Limite d&apos;utilisateurs</label>
            <input
              id="userLimit"
              className={input}
              type="number"
              name="userLimit"
              value={formData.userLimit}
              onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-1">
          {[
            { key: "administrator", label: "Administrateur" },
            { key: "disabled", label: "Désactivé" },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
              <input
                type="checkbox"
                name={item.key}
                checked={Boolean(formData[item.key as keyof typeof formData])}
                onChange={handleChange}
                className="h-5 w-5" />
              <span className="text-gray-700">{item.label}</span>
            </label>
          ))}
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
