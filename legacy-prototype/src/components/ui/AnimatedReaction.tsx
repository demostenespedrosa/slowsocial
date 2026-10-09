import React from 'react';

export type ReactionType = 'heart' | 'clap' | 'lightbulb' | 'handshake' | 'fire' | 'thinking';

interface AnimatedReactionProps {
  type: ReactionType | string;
  size?: number;
  className?: string;
  interactive?: boolean;
}

export const AnimatedReaction: React.FC<AnimatedReactionProps> = ({
  type,
  size = 36,
  className = '',
  interactive = true,
}) => {
  switch (type) {
    case 'heart':
      return (
        <div
          className={`relative flex items-center justify-center select-none ${className}`}
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-sm overflow-visible animate-lottie-heart"
          >
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF453A" />
                <stop offset="60%" stopColor="#FF2D55" />
                <stop offset="100%" stopColor="#FF375F" />
              </linearGradient>
              <filter id="glowHeart" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Partículas de brilho ao redor */}
            <circle cx="8" cy="12" r="1.8" fill="#FF9F0A" className="animate-sparkle-1" />
            <circle cx="40" cy="10" r="1.5" fill="#FFD60A" className="animate-sparkle-2" />
            <circle cx="42" cy="32" r="1.8" fill="#FF453A" className="animate-sparkle-3" />
            <circle cx="6" cy="30" r="1.4" fill="#FF375F" className="animate-sparkle-2" />

            {/* Coração Central */}
            <path
              d="M24 41.5C24 41.5 6 29.5 6 17.5C6 11.1 11.1 6 17.5 6C21.2 6 24 8.5 24 8.5C24 8.5 26.8 6 30.5 6C36.9 6 42 11.1 42 17.5C42 29.5 24 41.5 24 41.5Z"
              fill="url(#heartGrad)"
            />

            {/* Reflexo de luz suave (specular highlight) */}
            <path
              d="M13 12C11 14 10 17 10 19"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>
      );

    case 'clap':
      return (
        <div
          className={`relative flex items-center justify-center select-none ${className}`}
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-sm overflow-visible animate-lottie-clap"
          >
            <defs>
              <linearGradient id="clapGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD60A" />
                <stop offset="100%" stopColor="#FF9F0A" />
              </linearGradient>
              <linearGradient id="clapGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFAA33" />
                <stop offset="100%" stopColor="#D4A359" />
              </linearGradient>
            </defs>

            {/* Ondas de som / palmas */}
            <path
              d="M16 6C13 9 12 14 13 18"
              stroke="#FFD60A"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="animate-clap-wave"
            />
            <path
              d="M24 4C24 7 24 9 24 10"
              stroke="#FF9F0A"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="animate-clap-wave delay-75"
            />
            <path
              d="M32 6C35 9 36 14 35 18"
              stroke="#FFD60A"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="animate-clap-wave delay-150"
            />

            {/* Mão Esquerda */}
            <g className="animate-clap-left">
              <path
                d="M17 18C15 15 12 17 10 20C8 23 8 28 12 34L20 40L25 36L19 25L17 18Z"
                fill="url(#clapGrad1)"
              />
            </g>

            {/* Mão Direita */}
            <g className="animate-clap-right">
              <path
                d="M31 18C33 15 36 17 38 20C40 23 40 28 36 34L28 40L23 36L29 25L31 18Z"
                fill="url(#clapGrad2)"
              />
            </g>
          </svg>
        </div>
      );

    case 'lightbulb':
      return (
        <div
          className={`relative flex items-center justify-center select-none ${className}`}
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-sm overflow-visible animate-lottie-bulb"
          >
            <defs>
              <linearGradient id="bulbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF275" />
                <stop offset="50%" stopColor="#FFD60A" />
                <stop offset="100%" stopColor="#FF9F0A" />
              </linearGradient>
            </defs>

            {/* Raios de luz radiante */}
            <line x1="24" y1="2" x2="24" y2="6" stroke="#FFD60A" strokeWidth="2.5" strokeLinecap="round" className="animate-ray-pulse" />
            <line x1="9" y1="9" x2="12" y2="12" stroke="#FFD60A" strokeWidth="2.5" strokeLinecap="round" className="animate-ray-pulse delay-100" />
            <line x1="39" y1="9" x2="36" y2="12" stroke="#FFD60A" strokeWidth="2.5" strokeLinecap="round" className="animate-ray-pulse delay-100" />
            <line x1="3" y1="22" x2="7" y2="22" stroke="#FFD60A" strokeWidth="2.5" strokeLinecap="round" className="animate-ray-pulse" />
            <line x1="45" y1="22" x2="41" y2="22" stroke="#FFD60A" strokeWidth="2.5" strokeLinecap="round" className="animate-ray-pulse" />

            {/* Bulbo de Vidro */}
            <path
              d="M24 10C17.37 10 12 15.37 12 22C12 26.65 14.65 30.7 18.5 32.7V37C18.5 37.83 19.17 38.5 20 38.5H28C28.83 38.5 29.5 37.83 29.5 37V32.7C33.35 30.7 36 26.65 36 22C36 15.37 30.63 10 24 10Z"
              fill="url(#bulbGrad)"
            />

            {/* Filamento e Brilho Interno */}
            <path
              d="M21 24C21 21 27 21 27 24C27 27 21 27 21 30"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
              className="animate-filament-pulse"
            />

            {/* Rosca / Base de Metal */}
            <path d="M19 40H29" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M21 43H27" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'handshake':
      return (
        <div
          className={`relative flex items-center justify-center select-none ${className}`}
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-sm overflow-visible animate-lottie-handshake"
          >
            <defs>
              <linearGradient id="shakeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#30D158" />
                <stop offset="100%" stopColor="#248A3D" />
              </linearGradient>
              <linearGradient id="shakeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34C759" />
                <stop offset="100%" stopColor="#1E7E34" />
              </linearGradient>
            </defs>

            {/* Aura de apoio circular */}
            <circle cx="24" cy="24" r="20" fill="#30D158" opacity="0.12" className="animate-ping-slow" />

            {/* Mão 1 */}
            <path
              d="M6 18L17 29L22 24L13 15C11 13 8 15 6 18Z"
              fill="url(#shakeGrad1)"
            />

            {/* Mão 2 Entrelaçada */}
            <path
              d="M42 18L31 29L26 24L35 15C37 13 40 15 42 18Z"
              fill="url(#shakeGrad2)"
            />

            {/* Nós dos Dedos Apertados */}
            <rect x="18" y="22" width="12" height="10" rx="4" fill="#30D158" className="animate-hand-squeeze" />

            {/* Brilhos de sucesso */}
            <circle cx="24" cy="10" r="1.8" fill="#30D158" className="animate-sparkle-1" />
            <circle cx="12" cy="38" r="1.4" fill="#34C759" className="animate-sparkle-2" />
            <circle cx="36" cy="38" r="1.4" fill="#34C759" className="animate-sparkle-3" />
          </svg>
        </div>
      );

    case 'fire':
      return (
        <div
          className={`relative flex items-center justify-center select-none ${className}`}
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-sm overflow-visible animate-lottie-fire"
          >
            <defs>
              <linearGradient id="fireOuter" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FF3B30" />
                <stop offset="50%" stopColor="#FF9500" />
                <stop offset="100%" stopColor="#FFCC00" />
              </linearGradient>
              <linearGradient id="fireInner" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FF9500" />
                <stop offset="100%" stopColor="#FFF275" />
              </linearGradient>
            </defs>

            {/* Fagulhas subindo */}
            <circle cx="16" cy="10" r="1.5" fill="#FF9500" className="animate-ember-1" />
            <circle cx="32" cy="8" r="1.8" fill="#FFCC00" className="animate-ember-2" />
            <circle cx="24" cy="4" r="1.3" fill="#FF3B30" className="animate-ember-3" />

            {/* Chama Externa */}
            <path
              d="M24 4C24 4 34 16 34 27C34 35 28.5 41 24 41C19.5 41 14 35 14 27C14 18 20 12 24 4Z"
              fill="url(#fireOuter)"
              className="animate-flame-outer"
            />

            {/* Chama Interna (Núcleo) */}
            <path
              d="M24 19C24 19 29 25 29 31C29 35.5 26.5 39 24 39C21.5 39 19 35.5 19 31C19 26 22 23 24 19Z"
              fill="url(#fireInner)"
              className="animate-flame-inner"
            />
          </svg>
        </div>
      );

    case 'thinking':
    default:
      return (
        <div
          className={`relative flex items-center justify-center select-none ${className}`}
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-sm overflow-visible animate-lottie-thinking"
          >
            <defs>
              <linearGradient id="thinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A390E4" />
                <stop offset="50%" stopColor="#7C65C1" />
                <stop offset="100%" stopColor="#5E47A3" />
              </linearGradient>
            </defs>

            {/* Rosto / Círculo Pensativo */}
            <circle cx="24" cy="24" r="18" fill="url(#thinkGrad)" />

            {/* Olhos que olham pra cima e piscam */}
            <g className="animate-thinking-eyes">
              <ellipse cx="18" cy="18" rx="2.5" ry="3.5" fill="white" />
              <circle cx="18.5" cy="16.5" r="1.6" fill="#1C1C1E" />

              <ellipse cx="28" cy="18" rx="2.5" ry="3.5" fill="white" />
              <circle cx="28.5" cy="16.5" r="1.6" fill="#1C1C1E" />
            </g>

            {/* Sobrancelhas levantadas */}
            <path d="M14 13C16 11 20 12 21 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M26 12C28 10 32 11 34 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />

            {/* Boquinha reflexiva inclinada */}
            <path d="M21 31C24 30 27 30 29 32" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />

            {/* Nuvem de Pensamento / Ponto de Interrogação Flutuante */}
            <g className="animate-floating-question">
              <circle cx="36" cy="8" r="6" fill="#FFD60A" />
              <text x="36" y="11" textAnchor="middle" fill="#1C1C1E" fontSize="9" fontWeight="bold">?</text>
            </g>
          </svg>
        </div>
      );
  }
};
