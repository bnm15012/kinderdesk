import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getVapidPublicKey, subscribePush } from "@/lib/push";

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

export function usePush() {
  const getKey = useServerFn(getVapidPublicKey);
  const subscribe = useServerFn(subscribePush);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;

    const run = async () => {
      const registration = await navigator.serviceWorker.ready;
      const { publicKey } = await (getKey as any)();

      const existing = await registration.pushManager.getSubscription();
      const sub = existing ?? (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

      const json = JSON.parse(JSON.stringify(sub)) as any;
      await (subscribe as any)({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
    };

    run().catch((e: any) => {
      console.error("Push subscription failed", e);
      window.alert("Push subscription failed: " + (e?.message ?? e));
    });
  }, [getKey, subscribe]);
}

export async function requestPushPermission() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}
