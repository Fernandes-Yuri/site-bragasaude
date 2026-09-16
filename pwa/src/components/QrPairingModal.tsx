import React, { useState, useEffect } from "react";
import { X, QrCode, Camera, ShieldCheck, AlertCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QrPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessPair: (patientName: string) => void;
}

export const QrPairingModal: React.FC<QrPairingModalProps> = ({ isOpen, onClose, onSuccessPair }) => {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || activeTab !== "camera") return;

    let scanner: Html5QrcodeScanner | null = null;
    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader-container",
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        );

        scanner.render(
          (decodedText) => {
            scanner?.clear();
            handleSuccess(decodedText);
          },
          () => {
            // scan failure noise
          }
        );
      } catch (e) {
        console.warn("Camera scan init failed:", e);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [isOpen, activeTab]);

  const handleSuccess = (_code: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccessPair("Dona Odete Braga");
      onClose();
    }, 1200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim().length < 6) {
      setErrorMessage("Digite o código de pareamento de 6 dígitos.");
      return;
    }
    handleSuccess(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Conectar Novo Familiar</h3>
            <p className="text-xs text-slate-400">Pareamento seguro de cuidador</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "camera" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Câmera / QR Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "manual" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Código de 6 dígitos
          </button>
        </div>

        {activeTab === "camera" ? (
          <div>
            <div
              id="qr-reader-container"
              className="w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center text-xs text-slate-500"
            />
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Aponte a câmera para o QR Code na tela do aplicativo Braga Saúde do paciente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                Código exibido no app do paciente:
              </label>
              <input
                type="text"
                maxLength={8}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="EX: 482-910"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:border-emerald-500 uppercase"
              />
              {errorMessage && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <span>Pareando com segurança...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmar Pareamento</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
