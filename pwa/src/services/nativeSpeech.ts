/**
 * Módulo de síntese de voz nativa do navegador (Web Speech API - SpeechSynthesis).
 * 
 * 100% executado no dispositivo do usuário, sem chamadas externas, sem Piper e
 * com latência zero de rede.
 */

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
  rate?: number; // Velocidade (padrão: 1.0)
  pitch?: number; // Tom (padrão: 1.0)
  volume?: number; // Volume (padrão: 1.0)
}

// Mantém referência da utterance ativa para evitar coleta de lixo prematura pelo navegador
let activeUtterance: SpeechSynthesisUtterance | null = null;
let watchdogInterval: number | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Verifica se a síntese de voz nativa está disponível no ambiente atual.
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/**
 * Atualiza e retorna a lista de vozes disponíveis.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

// Escuta carregamento assíncrono de vozes (comum no Chrome/Android)
if (isSpeechSynthesisSupported()) {
  if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }
}

/**
 * Encontra a melhor voz em Português do Brasil disponível no dispositivo.
 */
export function getBestPortugueseVoice(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  // 1. Vozes pt-BR
  const ptBrVoices = voices.filter(
    (v) => v.lang === "pt-BR" || v.lang === "pt_BR" || v.lang.toLowerCase() === "pt-br"
  );

  if (ptBrVoices.length > 0) {
    // Dá preferência para vozes neurais / naturais conhecidas se existirem
    const preferredNames = ["google", "natural", "luciana", "felipe", "maria", "daniel", "francisca"];
    const preferred = ptBrVoices.find((v) =>
      preferredNames.some((pref) => v.name.toLowerCase().includes(pref))
    );
    if (preferred) return preferred;

    // Retorna a primeira voz pt-BR disponível
    return ptBrVoices[0];
  }

  // 2. Qualquer voz em português (pt)
  const anyPt = voices.find((v) => v.lang.toLowerCase().startsWith("pt"));
  if (anyPt) return anyPt;

  // 3. Fallback: voz padrão do sistema
  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Limpa marcações markdown, quebras excessivas e pontuações estranhas
 * para gerar uma pronúncia limpa e humanizada.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return text
    // Remove cabeçalhos markdown (# Título)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove links [texto](url) -> texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove negrito e itálico (**texto**, *texto*, __texto__, _texto_)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove blocos de código e código inline (`código`)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove listas numeradas e bullets no início da linha
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove emojis mais comuns para não poluir leitura do leitor de tela
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    // Substitui quebras múltiplas de linha por vírgula ou ponto
    .replace(/\n+/g, ". ")
    // Normaliza espaços múltiplos
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Limpa o watchdog de 15 segundos do Chromium.
 */
function clearWatchdog(): void {
  if (watchdogInterval !== null) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

/**
 * Inicia o watchdog para evitar que navegadores baseados no Chromium
 * pausem a síntese após ~15 segundos em textos mais longos.
 */
function startWatchdog(): void {
  clearWatchdog();
  watchdogInterval = window.setInterval(() => {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    } else {
      clearWatchdog();
    }
  }, 10000);
}

/**
 * Retorna a instância de utterance atualmente ativa (se houver).
 */
export function getActiveUtterance(): SpeechSynthesisUtterance | null {
  return activeUtterance;
}

/**
 * Interrompe qualquer reprodução de voz em andamento.
 */
export function stopSpeaking(): void {
  clearWatchdog();
  if (!isSpeechSynthesisSupported()) return;

  try {
    if (activeUtterance || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignora erros de cancelamento
  }

  activeUtterance = null;
}

/**
 * Retorna se o navegador está falando no momento.
 */
export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
}

/**
 * Fala o texto utilizando a voz nativa do navegador.
 * 
 * @param text Texto a ser pronunciado
 * @param options Callbacks de ciclo de vida e parâmetros de reprodução
 * @returns true se o processo foi iniciado com sucesso, false caso contrário
 */
export function speakText(text: string, options?: SpeakOptions): boolean {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.(new Error("Síntese de voz não suportada pelo navegador"));
    return false;
  }

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    options?.onEnd?.();
    return false;
  }

  // Interrompe reproduções anteriores
  stopSpeaking();

  try {
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "pt-BR";
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    const voice = getBestPortugueseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      startWatchdog();
      options?.onStart?.();
    };

    utterance.onend = () => {
      clearWatchdog();
      activeUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      clearWatchdog();
      activeUtterance = null;
      // 'canceled' ou 'interrupted' são normais ao interromper manualmente
      if (event.error !== "canceled" && event.error !== "interrupted") {
        options?.onError?.(event);
      }
      options?.onEnd?.();
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    clearWatchdog();
    activeUtterance = null;
    options?.onError?.(err);
    return false;
  }
}
