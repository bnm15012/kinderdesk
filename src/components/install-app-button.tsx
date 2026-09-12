import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    (window as any).addEventListener("beforeinstallprompt", handler);

    const ua = navigator.userAgent.toLowerCase();
    const standalone = "standalone" in navigator ? (navigator as any).standalone : false;
    setIsIOS(/iphone|ipad|ipod/.test(ua) && !standalone);

    return () => {
      (window as any).removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!deferred && !isIOS) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setDeferred(null);
      }
      return;
    }

    Swal.fire({
      title: "Install KinderDesk",
      html: `<p class="text-left text-sm text-slate-600">1. Tap the <strong>Share</strong> icon in Safari.<br/>2. Scroll down and tap <strong>Add to Home Screen</strong>.<br/>3. Tap <strong>Add</strong>.</p>`,
      icon: "info",
      confirmButtonText: "Got it",
      confirmButtonColor: "#2563eb",
    });
  };

  return (
    <button onClick={handleClick} className={className}>
      <Download className="w-5 h-5" />
      Install app
    </button>
  );
}
