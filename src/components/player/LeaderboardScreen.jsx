import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const AVATAR_COLORS = [
  'bg-purple-500','bg-pink-500','bg-amber-500','bg-green-500',
  'bg-blue-500','bg-red-500','bg-indigo-500','bg-teal-500',
];
const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_CLASSES = ['rank-gold', 'rank-silver', 'rank-bronze'];
const CONFETTI_COLORS = ['#7c3aed','#ec4899','#f59e0b','#10b981','#3b82f6'];

const CONFETTI_PIECES = Array.from({ length: 30 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  animDuration: `${2 + Math.random() * 2}s`,
  animDelay: `${Math.random() * 2}s`,
  bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: `${6 + Math.random() * 8}px`,
}));

export default function LeaderboardScreen({ isFinal }) {
  const { leaderboard, myRank, myScore, playerId, leaveSession } = useSession();
  const [showConfetti, setShowConfetti] = useState(isFinal);

  useEffect(() => {
    if (!isFinal) return;
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, [isFinal]);

  const myHighlightEl = (
    <div className="glass-card-glow p-4 text-center flex-shrink-0">
      <p className="text-gray-400 text-sm">Tu posición</p>
      <p className="text-4xl font-bold text-white">#{myRank}</p>
      <p className="text-amber-400 font-bold text-lg">{(myScore || 0).toLocaleString()} pts</p>
    </div>
  );

  const listEl = (
    <div className="glass-card p-3 flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {leaderboard.map((player, idx) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-2 p-2.5 rounded-xl ${
              player.id === playerId ? 'bg-purple-600/30 ring-1 ring-purple-500' : 'bg-white/5'
            }`}
          >
            <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
              idx < 3 ? MEDAL_CLASSES[idx] : 'bg-white/10 text-gray-300 font-bold'
            }`}>
              {idx < 3 ? MEDAL[idx] : idx + 1}
            </div>
            <div className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`} style={{ width: 28, height: 28, fontSize: 12 }}>
              {player.name[0].toUpperCase()}
            </div>
            <span className="flex-1 text-white text-sm font-medium truncate">
              {player.name}{player.id === playerId ? ' (tú)' : ''}
            </span>
            <span className="text-white font-bold text-sm">{(player.score || 0).toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
      {isFinal && (
        <button className="btn-secondary w-full mt-3 flex-shrink-0" onClick={leaveSession}>
          🏠 Salir
        </button>
      )}
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col p-4 gap-3">
      {/* Header: logos */}
      <div className="flex items-center justify-between flex-shrink-0">
        <img src="/LOGO_QQSM.png" alt="QQSM" className="h-20 w-auto object-contain" />
        <img src="/LogoFondo_Transparente_Blanco.png" alt="Gen Hoot" className="h-12 w-auto object-contain" />
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {CONFETTI_PIECES.map((p, i) => (
            <div key={i} style={{
              position: 'absolute', top: '-10px',
              left: p.left, width: p.size, height: p.size,
              background: p.bg, borderRadius: '2px',
              animation: `confetti-fall ${p.animDuration} ${p.animDelay} ease-in forwards`,
            }} />
          ))}
        </div>
      )}

      {/* Content: portrait stacked, landscape side-by-side */}
      <div className="flex-1 flex flex-col landscape:flex-row gap-3 min-h-0">
      {/* Portrait: stacked — Landscape: left col */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 landscape:flex-none landscape:w-2/5">
        <div className="text-center flex-shrink-0">
          <div className="text-3xl mb-1">{isFinal ? '🏆' : '📊'}</div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {isFinal ? '¡Resultado final!' : 'Clasificación parcial'}
          </h2>
          {!isFinal && <p className="text-gray-400 text-sm mt-1">Siguiente pregunta próximamente...</p>}
        </div>
        {myHighlightEl}
        {/* List in portrait */}
        <div className="landscape:hidden flex-1 flex flex-col min-h-0">{listEl}</div>
      </div>

      {/* List in landscape */}
      <div className="portrait:hidden flex-1 min-h-0 flex flex-col">{listEl}</div>
      </div>
    </div>
  );
}
