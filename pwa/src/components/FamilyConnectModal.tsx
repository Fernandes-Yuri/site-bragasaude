import React, { useState, useEffect, useCallback } from "react";
import { X, QrCode, Camera, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { acceptFamilyBinding } from "../services/api";

interface FamilyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessPair: (patientName: string, relation: string, patientUserId: string) => void;
  defaultCaregiverName?: string;
  // Getter assincrono: tokens do Firebase expiram em ~1h, entao e preciso
  // buscar uma versao fresca no momento do envio, nao uma copia do login.
  getIdToken?: () => Promise<string | undefined>;
}

export const FamilyConnectModal: React.FC<FamilyConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccessPair,
  defaultCaregiverName = "Cuidador",
  getIdToken,
}) => {
  const [mode, setMode] = useState<"code" | "camera">("code");
  const [code, setCode] = useState("");
  const [relation, setRelation] = useState("Filho");
  const [caregiverName, setCaregiverName] = useState(defaultCaregiverName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultCaregiverName) {
      setCaregiverName(defaultCaregiverName);
    }
  }, [defaultCaregiverName]);

  // useCallback garante identidade estavel; o scanner sempre le a versao atual
  // de caregiverName/relation sem stale closure.
  const handleConnectWithCode = useCallback(
    async (targetCode: string) => {
      const clean = targetCode.trim().toUpperCase();
      if (clean.length !== 8) {
        setError("O código de conexão tem 8 caracteres. Confira no app do paciente.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Busca o token fresco no momento do envio (evita token vencido)
        const idToken = getIdToken ? await getIdToken() : undefined;
        const binding = await acceptFamilyBinding(clean, caregiverName, relation, idToken);
        if (binding) {
          onSuccessPair(
            binding.caregiverName ? `Familiar de ${binding.caregiverName}` : "Familiar Conectado",
            relation,
            binding.patientUserId
          );
          onClose();
        }
      } catch (err: any) {
        setError(err?.message || "Código de conexão não encontrado ou expirado. Gere um novo no app do familiar.");
      } finally {
        setIsLoading(false);
      }
    },
    [caregiverName, relation, getIdToken, onSuccessPair, onClose]
  );

  useEffect(() => {
    if (!isOpen || mode !== "camera") return;

    let scanner: Html5QrcodeScanner | null = null;
    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner(
          "qr-scanner-view",
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        );
        scanner.render(
          (text) => {
            scanner?.clear();
            handleConnectWithCode(text.trim().toUpperCase());
          },
          // AUD-PW(M): antes era () => {} — se o usuário negou permissão da
          // câmera ou o html5-qrcode falhava, a div ficava PRETA e nada
          // acontecia. O idoso apontava o celular sem feedback nenhum.
          (err) => {
            console.warn("QR scanner error", err);
            setError(
              "Não consegui acessar a câmera. Verifique a permissão no navegador ou digite o código manualmente."
            );
            setMode("code");
          }
        );
      } catch (e) {
        console.warn("Scanner failed to start", e);
        // AUD-PW(M): falha de inicialização também precisa avisar o usuário.
        setError(
          "Câmera indisponível neste dispositivo. Digite o código de conexão manualmente."
        );
        setMode("code");
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [isOpen, mode, handleConnectWithCode]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConnectWithCode(code);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#E5EBE8]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1E293B] text-base">Conectar Familiar</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#64748B] mb-4">
          Insira o <strong>código de 8 dígitos</strong> gerado no app do paciente ou leia o QR Code.
        </p>

        {/* Abas de Modo */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl mb-4">
          <button
            onClick={() => setMode("code")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === "code"
                ? "bg-white text-[#00897B] shadow-xs"
                : "text-[#64748B]"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código</span>
          </button>
          <button
            onClick={() => setMode("camera")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === "camera"
                ? "bg-white text-[#00897B] shadow-xs"
                : "text-[#64748B]"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Câmera</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FFF5F2] border border-[#D9532F]/30 flex items-center gap-2 text-xs text-[#D9532F]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === "code" ? (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#1E293B] block mb-1">
                Código de Conexão (8 caracteres)
              </label>
              <input
                type="text"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC12345"
                className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-[#1E293B] focus:border-[#00897B] uppercase outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1E293B] block mb-1">
                Seu Parentesco / Relação
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1E293B] focus:border-[#00897B] outline-hidden"
              >
                <option value="Filho">Filho(a)</option>
                <option value="Cônjuge">Cônjuge</option>
                <option value="Neto">Neto(a)</option>
                <option value="Irmão">Irmão/Irmã</option>
                <option value="Cuidador Profissional">Cuidador(a) Profissional</option>
                <option value="Amigo Próximo">Amigo(a) da Família</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#64748B]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={code.length !== 8 || isLoading}
                className="px-5 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00695C] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isLoading ? "Conectando..." : "Conectar"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div id="qr-scanner-view" className="w-full rounded-2xl overflow-hidden bg-black/5 min-h-[220px]" />
            <p className="text-[11px] text-[#64748B] text-center mt-3">
              Aponte a câmera para o QR Code exibido na tela do familiar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
