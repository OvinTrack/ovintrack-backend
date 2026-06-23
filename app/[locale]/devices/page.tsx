import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import DeviceList from "@/components/DeviceList";

export default async function DevicesPage()
{
  const t = await getTranslations('devices');

  return (
    <div className="p-8">
      <Suspense fallback={<div className="text-center py-12 text-gray-500">{t('loading')}</div>}>
        <DeviceList />
      </Suspense>
    </div>
  );
}
