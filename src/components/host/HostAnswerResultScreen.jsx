import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];

export default function HostAnswerResultScreen() {
  const {
    currentQuestion, currentQuestionIndex, sessionState, players, showLeaderboard, cancelSession,
  } = useSession();

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
    <div className="min-h-screen p-6 flex flex-col items-center max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">

        {/* Stat header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {correctPct >= 50 ? '🎉' : correctPct >= 25 ? '🤔' : '😅'}
          </div>
          <p className="text-gray-300 text-lg">
            <span className="text-green-400 font-bold">{correctCount}</span> de{' '}
            <span className="text-white font-bold">{players.length}</span> respondieron correctamente
          </p>
        </div>

        {/* Question recap */}
        <div className="glass-card p-5 mb-6 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">La pregunta era</p>
          <p className="text-white font-semibold text-lg">{currentQuestion.text}</p>
        </div>

        {/* Answer bars */}
        <div className="glass-card p-5 mb-6 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const count = answerCounts[idx];
            const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
            const isCorrect = idx === currentQuestion.correctIndex;

            return (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-300 text-sm font-bold w-6">{OPTION_LABELS[idx]}</span>
                  <span className={`text-sm ${isCorrect ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                    {option} {isCorrect && '✓'}
                  </span>
                  <span className="ml-auto text-gray-400 text-sm">{count} ({pct}%)</span>
                </div>
                <div className="h-8 bg-white/10 rounded-lg overflow-hidden">
                  <motion.div
                    className={`answer-bar ${OPTION_COLORS[idx]} ${isCorrect ? 'ring-2 ring-green-400' : ''}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                  >
                    {pct > 10 && <span className="text-white text-xs font-bold">{pct}%</span>}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button className="btn-primary flex-1 text-lg" onClick={showLeaderboard}>
            Ver clasificación 🏆
          </button>
          <button className="btn-secondary px-4" onClick={cancelSession} title="Cancelar sesión">
            ✕
          </button>
        </div>
      </motion.div>
    </div>
  );
}
