import React from "react";

/**
 * Envolve importações dinâmicas (React.lazy) com retry automático e recarregamento
 * caso ocorra falha de rede ou atualização de versão/hash de chunks no servidor.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const component = await factory();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("pwa_lazy_reload_done");
      }
      return component;
    } catch (error) {
      console.warn("Falha ao carregar módulo dinâmico. Verificando atualização...", error);
      const reloaded = typeof window !== "undefined" && window.sessionStorage.getItem("pwa_lazy_reload_done");
      if (!reloaded && typeof window !== "undefined") {
        window.sessionStorage.setItem("pwa_lazy_reload_done", "true");
        window.location.reload();
      }
      throw error;
    }
  });
}
