import { AppLayout } from "@/components/app-layout";
import { MaterialSearch } from "@/components/material-search";

export default function MaterialsPage() {
  return (
    <AppLayout>
      <div className="flex justify-center items-start">
        <MaterialSearch />
      </div>
    </AppLayout>
  );
}
