import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const AVATAR_COLORS = [
  'bg-purple-500','bg-pink-500','bg-amber-500','bg-green-500',
  'bg-blue-500','bg-red-500','bg-indigo-500','bg-teal-500',
];
const MEDAL = ['🥇', '🥈', '🥉'];

export default function AnswerResultScreen() {
  const {
    currentQuestion, myAnswer, myScore, myRank, leaderboard, playerId,
  } = useSession();

  const prevRankRef = useRef(myRank);
  const [rankDelta, setRankDelta] = useState(0);

  useEffect(() => {
    setRankDelta(prevRankRef.current - myRank);
    prevRankRef.current = myRank;
  }, [myRank]);

  if (!currentQuestion) return null;

  const isCorrect = myAnswer?.isCorrect ?? false;
  const pointsEarned = myAnswer?.pointsEarned ?? 0;
  const correctOption = currentQuestion.options[currentQuestion.correctIndex];
  const top5 = leaderboard.slice(0, 5);
  const myPosition = leaderboard.findIndex((p) => p.id === playerId);
  const showMyRow = myPosition >= 5;

  const resultCardEl = (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`glass-card-glow p-4 text-center flex-shrink-0 ${
        isCorrect ? 'border-green-500/50' : 'border-red-500/30'
      }`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
        className="text-4xl mb-1"
      >
        {isCorrect ? '✅' : '❌'}
      </motion.div>

      <h2 className={`text-xl font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}
        style={{ fontFamily: 'var(--font-display)' }}>
        {isCorrect ? '¡Correcto!' : 'Incorrecto'}
      </h2>

      {isCorrect ? (
        <p className="text-amber-400 text-lg font-bold">+{pointsEarned.toLocaleString()} pts</p>
      ) : (
        <p className="text-gray-400 text-sm">0 puntos</p>
      )}

      {!isCorrect && (
        <div className="mt-3 p-3 rounded-xl bg-green-900/30 border border-green-500/30">
          <p className="text-gray-400 text-xs mb-1">La respuesta correcta era</p>
          <p className="text-green-400 font-semibold text-sm">{correctOption}</p>
        </div>
      )}
    </motion.div>
  );

  const scoreBarEl = (
    <div className="glass-card p-3 flex items-center justify-around flex-shrink-0">
      <div className="text-center">
        <p className="text-gray-400 text-xs mb-0.5">Puntaje</p>
        <p className="text-white font-bold text-lg">{(myScore || 0).toLocaleString()}</p>
      </div>
      <div className="w-px h-8 bg-white/10" />
      <div className="text-center">
        <p className="text-gray-400 text-xs mb-0.5">Posición</p>
        <p className="text-white font-bold text-lg">#{myRank}</p>
      </div>
      {rankDelta !== 0 && (
        <>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-0.5">Cambio</p>
            <p className={`font-bold text-lg ${rankDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {rankDelta > 0 ? `▲${rankDelta}` : `▼${Math.abs(rankDelta)}`}
            </p>
          </div>
        </>
      )}
    </div>
  );

  const leaderboardEl = (
    <div className="glass-card p-3 flex-1 flex flex-col min-h-0">
      <p className="text-gray-400 text-xs font-medium mb-2 flex-shrink-0">Clasificación parcial</p>
      <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
        {top5.map((player, idx) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={`flex items-center gap-2 p-2 rounded-lg ${
              player.id === playerId ? 'bg-purple-600/30 ring-1 ring-purple-500' : 'bg-white/5'
            }`}
          >
            <span className="text-sm w-5 text-center">{idx < 3 ? MEDAL[idx] : idx + 1}</span>
            <div className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`} style={{ width: 26, height: 26, fontSize: 11 }}>
              {player.name[0].toUpperCase()}
            </div>
            <span className="flex-1 text-sm text-white truncate">{player.name}</span>
            <span className="text-white text-sm font-bold">{(player.score || 0).toLocaleString()}</span>
          </motion.div>
        ))}

        {showMyRow && (
          <>
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-gray-500 text-xs">···</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-600/30 ring-1 ring-purple-500">
              <span className="text-sm w-5 text-center text-white">#{myRank}</span>
              <div className={`player-avatar ${AVATAR_COLORS[myPosition % AVATAR_COLORS.length]}`} style={{ width: 26, height: 26, fontSize: 11 }}>
                {leaderboard[myPosition]?.name[0].toUpperCase()}
              </div>
              <span className="flex-1 text-sm text-white truncate">{leaderboard[myPosition]?.name} (tú)</span>
              <span className="text-white text-sm font-bold">{(myScore || 0).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
      <p className="text-gray-500 text-xs text-center mt-2 flex-shrink-0">Esperando al host...</p>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col p-4 gap-3">
      {/* Header: logos */}
      <div className="flex items-center justify-between flex-shrink-0">
        <img src="/LOGO_QQSM.png" alt="QQSM" className="h-12 w-auto object-contain" />
        <img src="/LogoFondo_Transparente_Blanco.png" alt="Gen Hoot" className="h-12 w-auto object-contain" />
      </div>

      {/* Content: portrait stacked, landscape side-by-side */}
      <div className="flex-1 flex flex-col landscape:flex-row gap-3 min-h-0">
        {/* Portrait: stacked — Landscape: left col */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 landscape:flex-none landscape:w-2/5">
          {resultCardEl}
          {scoreBarEl}
          {/* Leaderboard in portrait */}
          <div className="landscape:hidden flex-1 flex flex-col min-h-0">{leaderboardEl}</div>
        </div>

        {/* Leaderboard in landscape */}
        <div className="portrait:hidden flex-1 min-h-0 flex flex-col">{leaderboardEl}</div>
      </div>
    </div>
  );
}
