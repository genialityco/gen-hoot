import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];
const AUTO_LEADERBOARD_DELAY = 4;

export default function HostAnswerResultScreen() {
  const {
    currentQuestion, currentQuestionIndex, sessionState, players,
    showLeaderboard, cancelSession, sessionMode,
  } = useSession();

  const isAuto = sessionMode === 'auto';
  const [countdown, setCountdown] = useState(AUTO_LEADERBOARD_DELAY);
  const autoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuto) return;
    setCountdown(AUTO_LEADERBOARD_DELAY); // eslint-disable-line react-hooks/set-state-in-effect
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(intervalRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    autoRef.current = setTimeout(() => showLeaderboard(), AUTO_LEADERBOARD_DELAY * 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(autoRef.current);
    };
  }, [isAuto, showLeaderboard]);

  const answerCounts = useMemo(() => {
    if (!currentQuestion) return [0, 0, 0, 0];
    const answers = sessionState?.answers?.[currentQuestionIndex] || {};
    const counts = [0, 0, 0, 0];
    Object.values(answers).forEach(({ answerIndex }) => {
      if (answerIndex >= 0 && answerIndex < 4) counts[answerIndex]++;
    });
    return counts;
  }, [currentQuestion, currentQuestionIndex, sessionState]);

  const totalAnswers = answerCounts.reduce((a, b) => a + b, 0);

  if (!currentQuestion) return null;

  const correctCount = answerCounts[currentQuestion.correctIndex];
  const correctPct = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;

  return (
    <div className="h-screen overflow-hidden flex flex-row">

      {/* Col 1: QQSM logo */}
      <div className="w-52 flex-shrink-0 flex items-center justify-center p-4">
        <img src="/LOGO_QQSM.png" alt="QQSM" className="w-full max-h-64 object-contain" />
      </div>

      {/* Col 2: content */}
      <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{correctPct >= 50 ? '🎉' : correctPct >= 25 ? '🤔' : '😅'}</span>
            <div>
              <p className="text-white text-xl font-bold">
                <span className="text-green-400">{correctCount}</span>
                <span className="text-gray-300 font-normal"> de </span>
                <span>{players.length}</span>
                <span className="text-gray-300 font-normal"> respondieron correctamente</span>
              </p>
              <p className="text-gray-400 text-sm">{correctPct}% de acierto</p>
            </div>
          </div>
          <button className="btn-secondary text-sm py-2 px-4" onClick={cancelSession}>✕ Cancelar</button>
        </div>

        {/* 2-col: question recap | answer bars */}
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left: question + correct answer */}
        <div className="glass-card p-6 flex flex-col justify-center gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">La pregunta era</p>
            <p className="text-white font-bold text-2xl leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
              {currentQuestion.text}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-green-900/30 border border-green-500/30">
            <p className="text-gray-400 text-xs mb-1">Respuesta correcta</p>
            <p className="text-green-400 font-bold text-xl">
              {OPTION_LABELS[currentQuestion.correctIndex]}. {currentQuestion.options[currentQuestion.correctIndex]}
            </p>
          </div>
        </div>

        {/* Right: bars */}
        <div className="glass-card p-5 flex flex-col justify-center gap-4">
          {currentQuestion.options.map((option, idx) => {
            const count = answerCounts[idx];
            const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
            const isCorrect = idx === currentQuestion.correctIndex;
            return (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-300 text-sm font-bold w-6">{OPTION_LABELS[idx]}</span>
                  <span className={`text-sm flex-1 truncate ${isCorrect ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                    {option} {isCorrect && '✓'}
                  </span>
                  <span className="text-gray-400 text-sm font-mono">{count} ({pct}%)</span>
                </div>
                <div className="h-9 bg-white/10 rounded-xl overflow-hidden">
                  <motion.div
                    className={`answer-bar ${OPTION_COLORS[idx]} ${isCorrect ? 'ring-2 ring-green-400/60' : ''}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                  >
                    {pct > 8 && <span className="text-white text-sm font-bold">{pct}%</span>}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

        {/* Footer */}
        <div className="flex-shrink-0">
          <button className="btn-primary w-full text-lg py-3" onClick={showLeaderboard}>
            {isAuto ? `Ver clasificación 🏆 (${countdown}s)` : 'Ver clasificación 🏆'}
          </button>
        </div>
      </div>

      {/* Col 3: Gen Hoot logo */}
      <div className="w-52 flex-shrink-0 flex items-center justify-center p-4">
        <img src="/LogoFondo_Transparente_Blanco.png" alt="Gen Hoot" className="w-full max-h-64 object-contain" />
      </div>

    </div>
  );
}
