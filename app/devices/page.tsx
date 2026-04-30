import { Suspense } from "react";
import DeviceList from "@/components/DeviceList";

export default function DevicesPage()
{
  return (
    <div className="p-8">
      <Suspense fallback={<div className="text-center py-12 text-gray-500">Chargement...</div>}>
        <DeviceList />
      </Suspense>
    </div>
  );
}
