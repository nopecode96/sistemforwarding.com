export const dynamic = "force-dynamic";

import {
  getGlobalPorts,
  getGlobalCarriers,
  getGlobalCurrencies,
} from "@/actions/adminMasterActions";
import { MasterDataManagementView } from "@/components/admin/MasterDataManagementView";

export default async function AdminMasterDataPage() {
  const [portsData, carriersData, currencies] = await Promise.all([
    getGlobalPorts({ page: 1, pageSize: 50 }),
    getGlobalCarriers({ page: 1, pageSize: 50 }),
    getGlobalCurrencies(),
  ]);

  return (
    <MasterDataManagementView
      initialPorts={portsData}
      initialCarriers={carriersData}
      initialCurrencies={currencies}
    />
  );
}
