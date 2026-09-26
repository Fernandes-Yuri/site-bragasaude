import { BragaLogo } from "./BragaLogo";
import React, { useState, useCallback } from "react";
import { Lock, Mail, User, ArrowRight, ShieldAlert, ShieldCheck, AlertCircle, Clock, Smartphone } from "lucide-react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "../services/firebase";
import { GoogleRecaptchaWidget } from "./GoogleRecaptchaWidget";
import { API_BASE_URL } from "../services/api";
import { sendPhoneOtp, verifyPhoneOtp } from "../services/api";

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIpBlocked, setIsIpBlocked] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  // AUD-PW04: OTP verification step — cadastro agora exige verificação
  // por código OTP antes de criar a conta no Firebase Auth, espelhando
  // o fluxo do Android (otp/send → otp/verify).
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // useCallback: sem identidade estavel, cada tecla digitada recria o
  // RecaptchaVerifier (dep [onToken]), destruindo o widget resolvido.
  const handleCaptchaToken = useCallback((tok: string | null) => {
    setCaptchaToken(tok);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.warn("Falha no login com Google:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Não foi possível autenticar com o Google. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isIpBlocked) {
      setError("Endereço IP bloqueado por 24 horas pela Gateway devido a excesso de tentativas.");
      return;
    }

    if (!captchaToken) {
      setError("Por favor, conclua a verificação de segurança Google reCAPTCHA.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Informe o seu nome completo.");
        return;
      }
      if (password !== confirmPassword) {
        setError("A confirmação de senha não coincide.");
        return;
      }
      if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      if (!lgpdAccepted) {
        setError("É necessário concordar com os termos de tratamento de dados de saúde (LGPD) para criar a conta.");
        return;
      }
    }

    setIsLoading(true);
    try {
      // 1. Validação rigorosa na Gateway sob política Zero-Trust
      try {
        const checkRes = await fetch(`${API_BASE_URL}/api/auth/check-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: email.trim(),
            recaptchaToken: captchaToken,
          }),
        });

        if (checkRes.status === 403) {
          setIsIpBlocked(true);
          setError("ACESSO BLOQUEADO POR 24 HORAS: Este endereço IP violou as políticas de segurança da Gateway e foi bloqueado por 24 horas.");
          return;
        }

        if (checkRes.status === 429) {
          setError("Limite de tentativas excedido na Gateway. Aguarde para evitar o bloqueio de 24h.");
          return;
        }
      } catch (gatewayErr) {
        console.warn("Gateway check bypass:", gatewayErr);
      }

      // 2. OTP verification flow (AUD-PW04) — se já enviou, verifica.
      //    Se não enviou, manda o código agora.
      if (mode === "signup") {
        if (!otpSent) {
          // Envia OTP para o e-mail
          setOtpSending(true);
          try {
            const otpResult = await sendPhoneOtp(email.trim());
            if (!otpResult.success) {
              setOtpError(otpResult.message || "Não foi possível enviar o código OTP. Tente novamente.");
              setIsLoading(false);
              return;
            }
            setOtpSent(true);
            setOtpError(null);
            setError("Código OTP enviado para " + email.trim() + ". Confira e digite abaixo.");
            setIsLoading(false);
            return;
          } catch (otpErr) {
            console.warn("Falha no envio do OTP:", otpErr);
            setOtpError("Falha ao enviar o código OTP. Verifique sua conexão.");
            setIsLoading(false);
            return;
          } finally {
            setOtpSending(false);
          }
        }
        // Se otpSent, verifica o código na próxima etapa (abaixo)
      }

      // 3. Verificação do código OTP para cadastro (AUD-PW04)
      if (mode === "signup" && otpSent) {
        if (!otpCode.trim()) {
          setError("Informe o código OTP recebido.");
          return;
        }
        setOtpError(null);
        const otpVerify = await verifyPhoneOtp(email.trim(), otpCode.trim());
        if (!otpVerify.success) {
          setOtpError("Código OTP inválido ou expirado. Tente novamente.");
          return;
        }
      }

      // 4. Autenticação oficial Firebase
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      onSuccess();
    } catch (err: any) {
      console.warn("Erro de autenticação:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já possui cadastro. Faça login com suas credenciais.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas malsucedidas consecutivas. Seu acesso está sendo monitorado pela Gateway.");
      } else {
        setError(err.message || "Falha na autenticação. Verifique os dados.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFCFB] flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-[#E5EBE8] p-6">
      {/* Topo / Marca Braga Saúde */}
      <div className="pt-safe flex flex-col items-center text-center mt-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#F4FBF9] to-[#E0F2F1] flex items-center justify-center text-white shadow-lg shadow-emerald-900/15 mb-4">
          <BragaLogo className="w-16 h-16" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">BRAGA SAÚDE</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold bg-[#E0F2F1] text-[#00695C] border border-[#B2DFDB] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Modo Cuidador Oficial
          </span>
        </div>
        <p className="text-base text-[#64748B] mt-2 max-w-xs">
          Acompanhamento em tempo real da saúde, medicamentos e bem-estar dos seus familiares.
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EBE8] shadow-sm my-6">
        {/* Erro principal */}
        {isIpBlocked ? (
          <div className="mb-4 p-4 rounded-2xl bg-[#FFF5F2] border-2 border-[#D9532F] flex flex-col gap-2 text-sm text-[#D9532F] shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 text-[#D9532F]" />
              <span>ACESSO BLOQUEADO POR 24 HORAS</span>
            </div>
            <p className="leading-relaxed text-[#B91C1C]">
              Detectamos violações repetidas das diretrizes de segurança da Gateway.
              Por proteção dos dados clínicos, este endereço IP foi suspenso por 24 horas pela Gateway.
            </p>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#64748B] mt-1 bg-white/60 p-2 rounded-xl border border-[#D9532F]/20">
              <Clock className="w-3.5 h-3.5 text-[#D9532F]" />
              <span>Desbloqueio automático após 24 horas</span>
            </div>
          </div>
        ) : error ? (
          <div className="mb-4 p-3 rounded-2xl bg-[#FFF5F2] border border-[#D9532F]/30 flex items-start gap-2.5 text-sm text-[#D9532F]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Erro OTP (AUD-PW04) */}
        {otpError && (
          <div className="mb-3 p-3 rounded-2xl bg-[#FFF5F2] border border-[#D9532F]/30 flex items-start gap-2.5 text-sm text-[#D9532F]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{otpError}</span>
          </div>
        )}

        {/* 1. Botão Oficial Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-slate-50 active:scale-98 border border-[#CBD5E1] rounded-2xl p-3.5 flex items-center justify-center gap-3 text-sm font-semibold text-[#1E293B] transition-all shadow-2xs disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Entrar com o Google</span>
        </button>

        {/* Divisor */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-[#E2E8F0] w-full" />
          <span className="bg-white px-3 text-sm font-medium text-[#64748B] uppercase tracking-wider absolute">
            ou com e-mail
          </span>
        </div>

        {/* 2. Formulário E-mail e Senha */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label htmlFor="caregiver-name" className="text-sm font-semibold text-[#1E293B] block mb-1">Nome do Cuidador(a)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  id="caregiver-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-[#FAFCFB] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-base text-[#1E293B] focus:border-[#00695C] outline-hidden font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="caregiver-email" className="text-sm font-semibold text-[#1E293B] block mb-1">E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="email"
                id="caregiver-email"
                  value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                required
                className="w-full bg-[#FAFCFB] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-base text-[#1E293B] focus:border-[#00695C] outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="caregiver-password" className="text-sm font-semibold text-[#1E293B] block mb-1">Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="password"
                id="caregiver-password"
                  value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#FAFCFB] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-base text-[#1E293B] focus:border-[#00695C] outline-hidden font-medium"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="caregiver-confirm-password" className="text-sm font-semibold text-[#1E293B] block mb-1">Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="password"
                  id="caregiver-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#FAFCFB] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-base text-[#1E293B] focus:border-[#00695C] outline-hidden font-medium"
                />
              </div>
            </div>
          )}

          {/* Checkbox de Consentimento LGPD (Art. 11 - Dados de Saúde) */}
          {mode === "signup" && (
            <div className="pt-1 pb-1">
              <label className="flex min-h-12 items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#00695C] focus:ring-0 cursor-pointer accent-[#00695C] shrink-0"
                />
                <span className="text-sm text-[#64748B] leading-tight">
                  Concordo com os <strong className="text-[#1E293B]">Termos de Uso</strong> e autorizo o tratamento de dados de saúde e rotina familiar nos termos da <strong className="text-[#00695C]">LGPD (Art. 11)</strong>.
                </span>
              </label>
            </div>
          )}

          {/* Widget Oficial Google reCAPTCHA / Firebase Captcha */}
          <GoogleRecaptchaWidget onToken={handleCaptchaToken} />

          {/* AUD-PW04: Campo de verificação OTP para cadastro */}
          {mode === "signup" && otpSent && (
            <div className="space-y-3">
              <div className="relative">
                <Smartphone className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Digite o código OTP"
                  value={otpCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(v);
                    setOtpError(null);
                  }}
                  className="w-full bg-[#FAFCFB] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-base text-[#1E293B] focus:border-[#00695C] outline-hidden font-medium"
                />
              </div>
              <p className="text-xs text-[#64748B]">
                Código enviado para {email.trim()}. Confira e digite os 6 dígitos.
              </p>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtpError(null); }}
                className="text-xs text-[#00695C] hover:underline font-medium"
              >
                Reenviar código
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otpSending}
            className="w-full bg-[#00695C] hover:bg-[#00695C] active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-2xl py-3 flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/15"
          >
            <span>
              {isLoading
                ? "Processando..."
                : otpSending
                ? "Enviando código OTP..."
                : mode === "signup" && otpSent
                ? "Verificar e Criar Conta"
                : mode === "signup"
                ? "Enviar Código OTP"
                : mode === "login"
                ? "Entrar na Conta"
                : "Criar Conta de Cuidador"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Alternância de Modo (Login vs Cadastro) */}
        <div className="text-center mt-5">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setOtpCode("");
              setOtpSent(false);
              setOtpError(null);
            }}
            className="text-sm font-medium text-[#00695C] hover:underline"
          >
            {mode === "login"
              ? "Não tem conta? Cadastre-se como cuidador"
              : "Já possui uma conta? Fazer login"}
          </button>
        </div>
      </div>

      {/* Rodapé Seguro e Disclaimer Clínico */}
      <div className="pb-safe flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-sm text-[#64748B]">
          <ShieldCheck className="w-4 h-4 text-[#00695C]" />
          <span>Ambiente Seguro e Criptografado (LGPD)</span>
        </div>
        <p className="text-sm text-[#64748B] leading-tight max-w-xs px-2">
          O Braga Saúde é uma ferramenta de suporte ao autocuidado e acompanhamento familiar, não substituindo diagnósticos, prescrições ou condutas médicas.
        </p>
      </div>
    </div>
  );
};
