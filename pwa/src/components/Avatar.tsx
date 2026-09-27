import React, { useState } from "react";

interface AvatarProps {
  /** Nome usado para calcular as iniciais (fallback quando nao ha foto). */
  name?: string;
  /** Foto de perfil (photo_url do gateway ou foto Google); cai para iniciais se falhar. */
  photoUrl?: string | null;
  /** Classes do circulo (tamanho, fundo, borda) — ex.: "w-10 h-10 bg-white/20". */
  className?: string;
  /** Classes do texto das iniciais — ex.: "text-sm". */
  textClassName?: string;
}

/** Iniciais: ate 2 letras maiusculas das duas primeiras palavras. */
function avatarInitials(name?: string, fallback = "F"): string {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");
  return initials || fallback;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  photoUrl,
  className = "",
  textClassName = "text-sm",
}) => {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <div
      className={`relative overflow-hidden rounded-full flex items-center justify-center shrink-0 ${className}`}
    >
      {showPhoto ? (
        <img
          src={photoUrl as string}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <span className={`font-bold text-white ${textClassName}`}>
          {avatarInitials(name)}
        </span>
      )}
    </div>
  );
};
