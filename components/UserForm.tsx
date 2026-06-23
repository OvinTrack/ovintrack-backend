"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { FullTraccarUser } from "@/types/traccar-types";

interface UserFormProps
{
  user?: FullTraccarUser;
  onSuccess: (user: FullTraccarUser) => void;
  onCancel: () => void;
}

interface UserFormData
{
  name: string;
  email: string;
  password: string;
  phone: string;
  eleveurNumNational: string;
  eleveurAdresse: string;
  statutReproducteur: string;
  administrator: boolean;
  disabled: boolean;
  deviceLimit: number;
  userLimit: number;
}

function buildUserAttributes(formData: UserFormData, baseAttributes: Record<string, string>): Record<string, string>
{
  const attributes: Record<string, string> = { ...baseAttributes };

  const eleveurNumNational = formData.eleveurNumNational.trim();

  if (eleveurNumNational)
  {
    attributes.eleveurNumNational = eleveurNumNational;
  }
  else
  {
    delete attributes.eleveurNumNational;
  }

  const eleveurAdresse = formData.eleveurAdresse.trim();

  if (eleveurAdresse)
  {
    attributes.eleveurAdresse = eleveurAdresse;
  }
  else
  {
    delete attributes.eleveurAdresse;
  }

  const statutReproducteur = formData.statutReproducteur.trim();

  if (statutReproducteur)
  {
    attributes.statutReproducteur = statutReproducteur;
  }
  else
  {
    delete attributes.statutReproducteur;
  }

  return attributes;
}

export default function UserForm({ user, onSuccess, onCancel }: Readonly<UserFormProps>)
{
  const t = useTranslations('userForm');
  const isEditing = user !== undefined;

  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    phone: user?.phone ?? "",
    eleveurNumNational: user?.attributes?.eleveurNumNational ?? "",
    eleveurAdresse: user?.attributes?.eleveurAdresse ?? "",
    statutReproducteur: user?.attributes?.statutReproducteur ?? "",
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
      setMessage(t('errors.nameRequired'));
      setLoading(false);
      return;
    }

    if (!formData.email.trim())
    {
      setMessage(t('errors.emailRequired'));
      setLoading(false);
      return;
    }

    if (!isEditing && !formData.password.trim())
    {
      setMessage(t('errors.passwordRequired'));
      setLoading(false);
      return;
    }

    const attributes = buildUserAttributes(formData, user?.attributes ?? {});

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      administrator: formData.administrator,
      disabled: formData.disabled,
      deviceLimit: formData.deviceLimit,
      userLimit: formData.userLimit,
      ...(Object.keys(attributes).length > 0 && { attributes }),
    };

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
        throw new Error(data.message ?? t('errors.unknown'));
      }

      onSuccess(data);
    }
    catch (error: unknown)
    {
      setMessage(t('errors.prefix', { message: error instanceof Error ? error.message : t('errors.unknown') }));
    }
    finally
    {
      setLoading(false);
    }
  };

  let btnLabel = t('create');
  if (loading) btnLabel = t('sending');
  else if (isEditing) btnLabel = t('update');

  const input =
    "w-full rounded-xl border border-gray-300 text-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-lg mx-auto p-8 bg-white shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-semibold mb-8 text-center text-gray-700">
        {isEditing ? t('titleEdit') : t('titleCreate')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={label}>{t('name')} <span className="text-red-500">*</span></label>
          <input
            id="name"
            className={input}
            name="name"
            placeholder={t('namePlaceholder')}
            value={formData.name}
            onChange={handleChange}
            required />
        </div>

        <div>
          <label htmlFor="email" className={label}>{t('email')} <span className="text-red-500">*</span></label>
          <input
            id="email"
            className={input}
            type="email"
            name="email"
            placeholder={t('emailPlaceholder')}
            value={formData.email}
            onChange={handleChange}
            required />
        </div>

        <div>
          <label htmlFor="password" className={label}>
            {t('password')} {!isEditing && <span className="text-red-500">*</span>}
            {isEditing && (
              <span className="text-gray-400 font-normal"> {t('passwordEdit')}</span>
            )}
          </label>
          <input
            id="password"
            className={input}
            type="password"
            name="password"
            placeholder={isEditing ? t('passwordEditPlaceholder') : t('passwordPlaceholder')}
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password" />
        </div>

        <div>
          <label htmlFor="phone" className={label}>{t('phone')}</label>
          <input
            id="phone"
            className={input}
            name="phone"
            placeholder={t('phonePlaceholder')}
            value={formData.phone}
            onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="eleveurNumNational" className={label}>{t('breederNumber')}</label>
          <input
            id="eleveurNumNational"
            className={input}
            name="eleveurNumNational"
            placeholder={t('breederNumberPlaceholder')}
            value={formData.eleveurNumNational}
            onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="eleveurAdresse" className={label}>{t('breederAddress')}</label>
          <input
            id="eleveurAdresse"
            className={input}
            name="eleveurAdresse"
            placeholder={t('breederAddressPlaceholder')}
            value={formData.eleveurAdresse}
            onChange={handleChange} />
        </div>

        <div>
          <span className={label}>{t('reproductiveStatus')}</span>
          <div className="flex items-center gap-6">
            <label htmlFor="user-statut-reproducteur-geniteur" className="flex items-center gap-2 text-sm text-gray-700">
              <input
                id="user-statut-reproducteur-geniteur"
                type="radio"
                name="statutReproducteur"
                value="Géniteur"
                checked={formData.statutReproducteur === "Géniteur"}
                onChange={handleChange}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span>{t('geniteur')}</span>
            </label>
            <label htmlFor="user-statut-reproducteur-non-geniteur" className="flex items-center gap-2 text-sm text-gray-700">
              <input
                id="user-statut-reproducteur-non-geniteur"
                type="radio"
                name="statutReproducteur"
                value="Non Géniteur"
                checked={formData.statutReproducteur === "Non Géniteur"}
                onChange={handleChange}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span>{t('nonGeniteur')}</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="deviceLimit" className={label}>{t('deviceLimit')}</label>
            <input
              id="deviceLimit"
              className={input}
              type="number"
              name="deviceLimit"
              value={formData.deviceLimit}
              onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="userLimit" className={label}>{t('userLimit')}</label>
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
            { key: "administrator", label: t('administrator') },
            { key: "disabled", label: t('disabled') },
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
          <p className="text-sm text-center text-red-600">
            {message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition">
            {t('cancel')}
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
