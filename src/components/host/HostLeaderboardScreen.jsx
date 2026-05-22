import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const AVATAR_COLORS = [
  'bg-purple-500','bg-pink-500','bg-amber-500','bg-green-500',
  'bg-blue-500','bg-red-500','bg-indigo-500','bg-teal-500',
];
const MEDAL_CLASSES = ['rank-gold', 'rank-silver', 'rank-bronze'];
const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];
const CONFETTI_COLORS = ['#7c3aed','#ec4899','#f59e0b','#10b981','#3b82f6'];

const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 3}s`,
  animationDuration: `${2 + Math.random() * 2}s`,
  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  width: `${6 + Math.random() * 8}px`,
  height: `${6 + Math.random() * 8}px`,
}));

const AUTO_NEXT_DELAY = 6;

export default function HostLeaderboardScreen({ isFinal }) {
  const {
    leaderboard, questions, currentQuestionIndex, sessionState,
    nextQuestion, finishQuiz, resetSession, loading, sessionMode,
  } = useSession();

  const [showConfetti, setShowConfetti] = useState(isFinal);
  const isAuto = sessionMode === 'auto';
  const isLast = currentQuestionIndex >= questions.length - 1;
  const [countdown, setCountdown] = useState(AUTO_NEXT_DELAY);
  const autoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isFinal) return;
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, [isFinal]);

  useEffect(() => {
    if (!isAuto || isFinal) return;
    setCountdown(AUTO_NEXT_DELAY); // eslint-disable-line react-hooks/set-state-in-effect
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(intervalRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    autoRef.current = setTimeout(() => {
      if (isLast) finishQuiz(); else nextQuestion();
    }, AUTO_NEXT_DELAY * 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(autoRef.current);
    };
  }, [isAuto, isFinal, isLast, finishQuiz, nextQuestion]);

  function handleAdvance() {
    if (isFinal) resetSession();
    else if (isLast) finishQuiz();
    else nextQuestion();
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(isFinal ? 3 : 0);

  return (
    <div className="h-screen overflow-hidden flex flex-row relative">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {CONFETTI_PIECES.map((style, i) => (
            <div key={i} style={{
              position: 'absolute', top: '-10px',
              left: style.left, width: style.width, height: style.height,
              background: style.background, borderRadius: '2px',
              animation: `confetti-fall ${style.animationDuration} ${style.animationDelay} ease-in forwards`,
            }} />
          ))}
        </div>
      )}

      {/* Col 1: QQSM logo */}
      <div className="w-52 flex-shrink-0 flex items-center justify-center p-4">
        <img src="/LOGO_QQSM.png" alt="QQSM" className="w-full max-h-64 object-contain" />
      </div>

      {/* Col 2: content */}
      <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{isFinal ? '🏆' : '📊'}</span>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {isFinal ? '¡Clasificación final!' : `Después de pregunta ${currentQuestionIndex + 1}`}
            </h2>
          </div>
          <button className="btn-primary" onClick={handleAdvance} disabled={loading}>
            {isFinal
              ? '🔄 Nueva sesión'
              : isLast
              ? `🏁 Ver resultado final${isAuto ? ` (${countdown}s)` : ''}`
              : `➡️ Siguiente (${currentQuestionIndex + 2}/${questions.length})${isAuto ? ` (${countdown}s)` : ''}`}
          </button>
        </div>

        {/* Main 2-col */}
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Left: podium or top-3 list */}
          <div className="glass-card-glow p-6 flex flex-col min-h-0">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-4 text-center flex-shrink-0">
              Top 3
            </p>
            {top3.length >= 3 ? (
              <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="flex items-end justify-center gap-6 w-full">
                {[1, 0, 2].map((rankIdx) => {
                  const player = leaderboard[rankIdx];
                  if (!player) return null;
                  const podiumH = rankIdx === 0 ? 'h-28' : rankIdx === 1 ? 'h-20' : 'h-16';
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rankIdx * 0.15 }}
                      className="flex flex-col items-center"
                    >
                      <div className="text-3xl mb-1">{MEDAL_EMOJIS[rankIdx]}</div>
                      <div className={`player-avatar ${AVATAR_COLORS[rankIdx % AVATAR_COLORS.length]}`}
                        style={{ width: 48, height: 48, fontSize: 18 }}>
                        {player.name[0].toUpperCase()}
                      </div>
                      <p className="text-white text-sm font-bold mt-2 mb-1 text-center w-20 truncate">{player.name}</p>
                      <div className={`${MEDAL_CLASSES[rankIdx]} ${podiumH} w-24 flex flex-col items-center justify-center rounded-t-xl font-bold text-sm gap-0.5`}>
                        <span>{(player.score || 0).toLocaleString()}</span>
                        <span className="text-xs opacity-70">pts</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto">
                {top3.map((player, idx) => (
                  <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${MEDAL_CLASSES[idx]}`}>
                      {MEDAL_EMOJIS[idx]}
                    </div>
                    <div className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      {player.name[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-white font-semibold truncate">{player.name}</span>
                    <span className="text-white font-bold">{(player.score || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: full list (rest or all) */}
          <div className="glass-card p-4 flex flex-col min-h-0">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3 flex-shrink-0">
              {isFinal ? 'Clasificación completa' : 'Todos los jugadores'}
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {(isFinal ? rest : leaderboard).map((player, baseIdx) => {
                const idx = isFinal ? baseIdx + 3 : baseIdx;
                const pointsThisQ = sessionState?.answers?.[currentQuestionIndex]?.[player.id]?.pointsEarned;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: baseIdx * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                      idx < 3 ? MEDAL_CLASSES[idx] : 'bg-white/10 text-gray-300'
                    }`}>
                      {idx < 3 ? MEDAL_EMOJIS[idx] : idx + 1}
                    </div>
                    <div className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      {player.name[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-white text-sm font-medium truncate">{player.name}</span>
                    {!isFinal && pointsThisQ !== undefined && pointsThisQ > 0 && (
                      <span className="text-green-400 text-xs font-bold">+{pointsThisQ}</span>
                    )}
                    <span className="text-white font-bold">{(player.score || 0).toLocaleString()}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Col 3: Gen Hoot logo */}
      <div className="w-36 flex-shrink-0 flex items-center justify-center p-4">
        <img src="/LogoFondo_Transparente_Blanco.png" alt="Gen Hoot" className="w-full max-h-64 object-contain" />
      </div>

    </div>
  );
}
