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

const AUTO_NEXT_DELAY = 6; // seconds

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
    setCountdown(AUTO_NEXT_DELAY);
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(intervalRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    autoRef.current = setTimeout(() => {
      if (isLast) finishQuiz();
      else nextQuestion();
    }, AUTO_NEXT_DELAY * 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(autoRef.current);
    };
  }, [isAuto, isFinal, isLast, finishQuiz, nextQuestion]);

  function handleAdvance() {
    if (isFinal) {
      resetSession();
    } else if (isLast) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  }


  return (
    <div className="min-h-screen p-6 flex flex-col items-center max-w-2xl mx-auto relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {CONFETTI_PIECES.map((style, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-10px',
                left: style.left,
                width: style.width,
                height: style.height,
                background: style.background,
                borderRadius: '2px',
                animation: `confetti-fall ${style.animationDuration} ${style.animationDelay} ease-in forwards`,
              }}
            />
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{isFinal ? '🏆' : '📊'}</div>
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {isFinal ? '¡Clasificación final!' : `Después de pregunta ${currentQuestionIndex + 1}`}
          </h2>
        </div>

        {/* Podium top 3 when final */}
        {isFinal && leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[1, 0, 2].map((rankIdx) => {
              const player = leaderboard[rankIdx];
              if (!player) return null;
              const heights = ['h-24', 'h-32', 'h-20'];
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rankIdx * 0.15 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-2xl mb-1">{MEDAL_EMOJIS[rankIdx]}</div>
                  <div className={`player-avatar ${AVATAR_COLORS[rankIdx % AVATAR_COLORS.length]} text-lg mb-2`}>
                    {player.name[0].toUpperCase()}
                  </div>
                  <p className="text-white text-xs font-bold mb-1 text-center max-w-16 truncate">{player.name}</p>
                  <div className={`${MEDAL_CLASSES[rankIdx]} ${heights[rankIdx === 0 ? 1 : rankIdx === 1 ? 0 : 2]} w-20 flex items-center justify-center rounded-t-lg font-bold`}>
                    {(player.score || 0).toLocaleString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div className="glass-card p-4 mb-6 space-y-2">
          {leaderboard.map((player, idx) => {
            const pointsThisQ = sessionState?.answers?.[currentQuestionIndex]?.[player.id]?.pointsEarned;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  idx < 3 ? MEDAL_CLASSES[idx] : 'bg-white/10 text-gray-300'
                }`}>
                  {idx < 3 ? MEDAL_EMOJIS[idx] : idx + 1}
                </div>
                <div className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                  {player.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                </div>
                {!isFinal && pointsThisQ !== undefined && pointsThisQ > 0 && (
                  <span className="text-green-400 text-xs font-bold">+{pointsThisQ}</span>
                )}
                <span className="text-white font-bold">{(player.score || 0).toLocaleString()}</span>
              </motion.div>
            );
          })}
        </div>

        <button
          className="btn-primary w-full text-lg mb-3"
          onClick={handleAdvance}
          disabled={loading}
        >
          {isFinal
            ? '🔄 Nueva sesión'
            : isLast
            ? `🏁 Ver resultado final${isAuto ? ` (${countdown}s)` : ''}`
            : `➡️ Siguiente pregunta (${currentQuestionIndex + 2}/${questions.length})${isAuto ? ` (${countdown}s)` : ''}`}
        </button>
      </motion.div>
    </div>
  );
}
