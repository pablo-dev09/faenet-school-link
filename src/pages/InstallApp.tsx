import { useState, useEffect } from "react";
import { Download, Smartphone, Wifi, WifiOff, Share, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isPWA);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center page-enter">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="FaeNet" className="h-24 w-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">FaeNet</h1>
            <p className="text-sm text-muted-foreground">Rede Social da FAETEC</p>
          </div>
        </div>

        {/* Status online */}
        <div className={`flex items-center justify-center gap-2 text-sm ${isOnline ? "text-green-500" : "text-destructive"}`}>
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          {isOnline ? "Conectado" : "Sem conexão"}
        </div>

        {/* Já instalado */}
        {isInstalled ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Smartphone size={40} className="mx-auto text-primary" />
              <p className="font-semibold">App instalado! ✅</p>
              <p className="text-sm text-muted-foreground">O FaeNet já está na sua tela inicial.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Android / Chrome */}
            {deferredPrompt && (
              <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                <Download size={20} />
                Instalar FaeNet no celular
              </Button>
            )}

            {/* iOS instructions */}
            {isIOS && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="font-semibold text-sm">Para instalar no iPhone:</p>
                  <ol className="text-sm text-muted-foreground text-left space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Toque no botão <Share size={14} className="inline" /> <strong>Compartilhar</strong> no Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <Plus size={14} className="inline" /></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Generic */}
            {!deferredPrompt && !isIOS && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <p className="font-semibold text-sm">Para instalar no Android:</p>
                  <ol className="text-sm text-muted-foreground text-left space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Toque no menu <MoreVertical size={14} className="inline" /> do Chrome</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Toque em <strong>"Adicionar à tela inicial"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Confirme tocando em <strong>"Adicionar"</strong></span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground">
          O FaeNet funciona como um app nativo, mesmo sem internet!
        </p>
      </div>
    </div>
  );
}
