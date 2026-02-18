import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export default function AppLayout({ children, noPadding }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pb-14 md:pl-60 md:pb-0">
        <div className={`page-enter ${noPadding ? "mx-auto max-w-lg" : "mx-auto max-w-lg px-4 py-4"}`}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
