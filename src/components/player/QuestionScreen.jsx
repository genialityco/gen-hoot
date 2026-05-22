import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../../SessionContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_CLASSES = ['answer-btn-a', 'answer-btn-b', 'answer-btn-c', 'answer-btn-d'];
const OPTION_ICONS = ['🔴', '🔵', '🟡', '🟢'];
const OPTION_BAR_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];

const CIRCUMFERENCE = 2 * Math.PI * 36;

export default function QuestionScreen() {
  const {
    sessionState, currentQuestion, currentQuestionIndex,
    questions, submitAnswer, myAnswer, myLifelines,
    activateLifeline, getAudienceAnswers,
  } = useSession();

  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit || 20);
  const [timesUp, setTimesUp] = useState(false);
  const [audienceData, setAudienceData] = useState(null);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!currentQuestion || !sessionState?.questionStartedAt) return;
    const startedAt = sessionState.questionStartedAt;
    setTimesUp(false);
    setAudienceData(null);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setTimesUp(true);
      }
    }, 200);

    return () => clearInterval(timerRef.current);
  }, [currentQuestion, sessionState?.questionStartedAt]);

  if (!currentQuestion) return null;

  const ratio = timeLeft / currentQuestion.timeLimit;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const timerColor = ratio > 0.5 ? '#7c3aed' : ratio > 0.25 ? '#f59e0b' : '#ef4444';
  const isUrgent = timeLeft <= Math.ceil(currentQuestion.timeLimit * 0.25);

  const hasAnswered = myAnswer !== null;
  const isLocked = hasAnswered || timesUp;

  // 50/50: stored as { qIndex, hidden[] } so hidden options only apply to the question they were used on
  const fiftyFiftyData = myLifelines?.fiftyFifty;
  const hiddenOptions = fiftyFiftyData?.qIndex === currentQuestionIndex && Array.isArray(fiftyFiftyData?.hidden)
    ? new Set(fiftyFiftyData.hidden)
    : new Set();
  const fiftyFiftyUsed = !!fiftyFiftyData;
  const askAudienceUsed = !!myLifelines?.askAudience;

  function handleAnswer(idx) {
    if (isLocked || hiddenOptions.has(idx)) return;
    submitAnswer(currentQuestionIndex, idx);
  }

  async function handleFiftyFifty() {
    if (fiftyFiftyUsed || isLocked) return;
    const { correctIndex, options } = currentQuestion;
    const wrongIndices = options.map((_, i) => i).filter((i) => i !== correctIndex);
    for (let i = wrongIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
    }
    // Keep 1 wrong visible, hide the rest
    const toHide = wrongIndices.slice(0, wrongIndices.length - 1);
    await activateLifeline('fiftyFifty', { qIndex: currentQuestionIndex, hidden: toHide });
  }

  async function handleAskAudience() {
    if (askAudienceUsed || isLocked || loadingAudience) return;
    setLoadingAudience(true);
    try {
      const counts = await getAudienceAnswers(currentQuestionIndex, currentQuestion.options.length);
      setAudienceData(counts);
      await activateLifeline('askAudience');
    } finally {
      setLoadingAudience(false);
    }
  }

  const totalVotes = audienceData ? audienceData.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="glass-card px-3 py-1 text-sm text-gray-300">
          {currentQuestionIndex + 1} / {questions.length}
        </div>

        <div className={`timer-ring ${isUrgent ? 'timer-urgent' : ''}`}>
          <svg viewBox="0 0 80 80">
            <circle className="timer-bg" cx="40" cy="40" r="36" />
            <circle
              className="timer-progress"
              cx="40" cy="40" r="36"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              stroke={timerColor}
            />
          </svg>
          <div className="timer-text" style={{ color: timerColor }}>{timeLeft}</div>
        </div>
      </div>

      {/* Lifelines */}
      {!isLocked && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleFiftyFifty}
            disabled={fiftyFiftyUsed}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
              ${fiftyFiftyUsed
                ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                : 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 active:scale-95'
              }`}
          >
            50/50
          </button>
          <button
            onClick={handleAskAudience}
            disabled={askAudienceUsed || loadingAudience}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
              ${askAudienceUsed
                ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 active:scale-95'
              }`}
          >
            {loadingAudience ? '...' : '👥 Público'}
          </button>
        </div>
      )}

      {/* Audience results */}
      <AnimatePresence>
        {audienceData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 mb-4 overflow-hidden"
          >
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3 text-center">
              Así votó el público
            </p>
            <div className="space-y-2">
              {currentQuestion.options.map((_, idx) => {
                if (hiddenOptions.has(idx)) return null;
                const pct = totalVotes > 0 ? Math.round((audienceData[idx] / totalVotes) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">{OPTION_LABELS[idx]}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${OPTION_BAR_COLORS[idx]}`}
                      />
                    </div>
                    <span className="text-xs text-gray-300 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-glow p-6 text-center mb-6 flex-shrink-0"
      >
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Pregunta</p>
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {currentQuestion.text}
        </h2>
        <p className="text-gray-500 text-xs mt-2">
          Máx: {currentQuestion.points.toLocaleString()} pts
        </p>
      </motion.div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {currentQuestion.options.map((option, idx) => {
          const hidden = hiddenOptions.has(idx);
          const selected = hasAnswered && myAnswer.answerIndex === idx;
          const dimmed = hasAnswered && !selected;

          if (hidden) {
            return <div key={idx} className="rounded-2xl bg-white/5 opacity-20 min-h-20" />;
          }

          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              onClick={() => handleAnswer(idx)}
              disabled={isLocked}
              className={`
                ${OPTION_CLASSES[idx]}
                ${selected ? 'answer-btn-selected' : ''}
                ${dimmed ? 'opacity-40' : ''}
                p-4 rounded-2xl text-left min-h-20 flex flex-col justify-between
                transition-opacity duration-200
              `}
            >
              <span className="text-lg">{OPTION_ICONS[idx]}</span>
              <span className="font-bold text-white text-sm leading-tight">
                {OPTION_LABELS[idx]}. {option}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* State overlays */}
      <AnimatePresence>
        {timesUp && !hasAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 z-10"
          >
            <div className="glass-card-glow p-8 text-center">
              <div className="text-5xl mb-3">⏰</div>
              <h3 className="text-2xl font-bold text-white">¡Tiempo!</h3>
              <p className="text-gray-400 mt-2">No respondiste a tiempo</p>
            </div>
          </motion.div>
        )}

        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 glass-card p-4 text-center"
          >
            <p className="text-green-400 font-semibold">✓ Respuesta registrada</p>
            <p className="text-gray-400 text-sm mt-1">Esperando al host...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
