import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey?: string;
  onToken: (token: string | null) => void;
}

// SiteKey padrão (Cloudflare Turnstile Always-Pass para testes ou chave real via env)
const DEFAULT_SITE_KEY = "1x00000000000000000000AA";

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey = DEFAULT_SITE_KEY,
  onToken,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onToken);
  cbRef.current = onToken;

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      try {
        if (widgetId) window.turnstile.remove(widgetId);
      } catch {
        /* ignore */
      }
      try {
        widgetId = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (t: string) => cbRef.current(t),
          "expired-callback": () => cbRef.current(null),
          "error-callback": () => cbRef.current(null),
          theme: "light",
        });
      } catch (err) {
        console.warn("Turnstile render err:", err);
      }
    };

    if (window.turnstile) {
      render();
    } else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    }

    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  return <div ref={ref} className="flex justify-center my-3 min-h-[65px]" />;
};
