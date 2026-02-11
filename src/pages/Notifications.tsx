import AppLayout from "@/components/AppLayout";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <AppLayout>
      <h1 className="text-lg font-bold mb-4">Notificações</h1>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Bell size={48} className="mb-4 opacity-30" />
        <p className="text-sm">Nenhuma notificação ainda.</p>
        <p className="text-xs mt-1">Em breve você receberá atualizações aqui!</p>
      </div>
    </AppLayout>
  );
}
