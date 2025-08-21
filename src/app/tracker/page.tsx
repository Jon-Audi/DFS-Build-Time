import { AppLayout } from "@/components/app-layout";
import { Timer } from "@/components/timer";

export default function TrackerPage() {
  return (
    <AppLayout>
      <div className="flex justify-center items-start">
        <Timer />
      </div>
    </AppLayout>
  );
}
