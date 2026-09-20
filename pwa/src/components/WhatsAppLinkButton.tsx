import { useEffect, useState } from "react";
import { currentTotpCode, secondsUntilRotation } from "../services/waLinkTotp";

/**
 * Botao de vincular WhatsApp (arquitetura TOTP temporaria).
 *
 * No ato do clique le o codigo TOTP ATUAL do segredo da conta, monta o link
 * wa.me com a mensagem pronta e abre o WhatsApp. O usuario so aperta enviar.
 *
 * Mostra a validade decrescente: o codigo vale por 3 minutos, sem tolerancia -
 * se vencer, o usuario volta aqui e toca de novo para pegar um codigo novo.
 */
interface WhatsAppLinkButtonProps {
  totpSecret: string | null | undefined;
  businessPhone?: string;
  alreadyLinked?: boolean;
  onLinkOpened?: () => void;
}

export const WhatsAppLinkButton: React.FC<WhatsAppLinkButtonProps> = ({
  totpSecret,
  businessPhone = "5511967808252",
  alreadyLinked = false,
  onLinkOpened,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntilRotation());
  // AUD-PW(M): currentTotpCode usa crypto.subtle e pode rejeitar (segredo
  // malformado, contexto inseguro HTTP, navegador sem suporte). Sem try/catch
  // virava promise rejection nao tratada e o botao simplesmente nao fazia nada.
  const [linkError, setLinkError] = useState<string | null>(null);

  // Relogio decrescente da janela do codigo.
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntilRotation()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!totpSecret) {
    // Sem segredo ainda: a conta ainda nao sincronizou. Nao promete o que nao pode.
    return (
      <div className="w-full rounded-2xl bg-slate-100 p-4 text-center">
        <p className="text-sm text-slate-500">
          Assim que seu cadastro for concluido, liberamos o vinculo do WhatsApp aqui.
        </p>
      </div>
    );
  }

  const handleLink = async () => {
    if (!totpSecret) return;
    setLinkError(null);
    try {
      const code = await currentTotpCode(totpSecret);
      if (!code) {
        setLinkError("Não foi possível gerar o código agora. Tente novamente em instantes.");
        return;
      }
      const text = encodeURIComponent(`Vincular Braga Saude ${code}`);
      window.open(`https://wa.me/${businessPhone}?text=${text}`, "_blank", "noopener,noreferrer");
      onLinkOpened?.();
    } catch (e) {
      // AUD-PW(M): falha silenciosa do crypto.subtle — agora o usuário sabe.
      console.warn("Falha ao gerar TOTP do vínculo", e);
      setLinkError(
        "Não conseguimos gerar o código de vínculo. Recarregue a página e tente novamente."
      );
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleLink}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#00A884] py-3.5 text-base font-bold text-white shadow-sm transition active:scale-[0.99]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span>{alreadyLinked ? "Vincular novamente" : "Vincular meu WhatsApp"}</span>
      </button>
      {linkError && (
        <p className="mt-2 text-center text-sm font-medium text-red-600" role="alert">
          {linkError}
        </p>
      )}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            secondsLeft <= 30 ? "bg-red-600" : "bg-[#00A884]"
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-slate-500">
          Codigo valido por {secondsLeft}s - se vencer, toque de novo
        </span>
      </div>
    </div>
  );
};
