import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pb-16 md:pl-60 md:pb-0">
        <div className="mx-auto max-w-lg px-4 py-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
