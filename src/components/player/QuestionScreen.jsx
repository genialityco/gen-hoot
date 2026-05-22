import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../../SessionContext';
import { subscribeToAudienceAnswers } from '../../firebase';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_CLASSES = ['answer-btn-a', 'answer-btn-b', 'answer-btn-c', 'answer-btn-d'];
const OPTION_ICONS = ['🔴', '🔵', '🟡', '🟢'];
const OPTION_BAR_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];
const CIRCUMFERENCE = 2 * Math.PI * 36;

export default function QuestionScreen() {
  const {
    sessionCode, sessionState, currentQuestion, currentQuestionIndex,
    questions, submitAnswer, myAnswer, myLifelines,
    activateLifeline,
  } = useSession();

  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit || 20);
  const [timesUp, setTimesUp] = useState(false);
  const [audienceData, setAudienceData] = useState(null);
  const [audienceRequested, setAudienceRequested] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!currentQuestion || !sessionState?.questionStartedAt) return;
    const startedAt = sessionState.questionStartedAt;
    setTimesUp(false); // eslint-disable-line react-hooks/set-state-in-effect
    setAudienceData(null);
    setAudienceRequested(false);

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

  const askAudienceUsed = !!myLifelines?.askAudience;

  useEffect(() => {
    if (!audienceRequested || !sessionCode) return;
    const unsubscribe = subscribeToAudienceAnswers(
      sessionCode, currentQuestionIndex, currentQuestion?.options.length ?? 4,
      (counts) => setAudienceData(counts),
    );
    return () => unsubscribe();
  }, [audienceRequested, sessionCode, currentQuestionIndex, currentQuestion?.options.length]);

  if (!currentQuestion) return null;

  const ratio = timeLeft / currentQuestion.timeLimit;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const timerColor = ratio > 0.5 ? '#7c3aed' : ratio > 0.25 ? '#f59e0b' : '#ef4444';
  const isUrgent = timeLeft <= Math.ceil(currentQuestion.timeLimit * 0.25);

  const hasAnswered = myAnswer !== null;
  const isLocked = hasAnswered || timesUp;

  const fiftyFiftyData = myLifelines?.fiftyFifty;
  const hiddenOptions = fiftyFiftyData?.qIndex === currentQuestionIndex && Array.isArray(fiftyFiftyData?.hidden)
    ? new Set(fiftyFiftyData.hidden)
    : new Set();
  const fiftyFiftyUsed = !!fiftyFiftyData;

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
    await activateLifeline('fiftyFifty', { qIndex: currentQuestionIndex, hidden: wrongIndices.slice(0, wrongIndices.length - 1) });
  }

  async function handleAskAudience() {
    if (askAudienceUsed || isLocked) return;
    setAudienceRequested(true);
    await activateLifeline('askAudience');
  }

  const totalVotes = audienceData ? audienceData.reduce((a, b) => a + b, 0) : 0;

  const timerEl = (
    <div className={`timer-ring flex-shrink-0 ${isUrgent ? 'timer-urgent' : ''}`}>
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
  );

  const lifelinesEl = (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={handleFiftyFifty}
        disabled={fiftyFiftyUsed}
        className={`flex-1 py-1.5 rounded-xl text-sm font-bold transition-all
          ${fiftyFiftyUsed
            ? 'bg-white/10 text-gray-500 cursor-not-allowed'
            : 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 active:scale-95'
          }`}
      >
        50/50
      </button>
      <button
        onClick={handleAskAudience}
        disabled={askAudienceUsed}
        className={`flex-1 py-1.5 rounded-xl text-sm font-bold transition-all
          ${askAudienceUsed
            ? 'bg-white/10 text-gray-500 cursor-not-allowed'
            : 'bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 active:scale-95'
          }`}
      >
        👥 Público
      </button>
    </div>
  );

  const audiencePanelEl = audienceData && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-card p-3 overflow-hidden flex-shrink-0"
    >
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 text-center">
        👥 Así votó el público {totalVotes > 0 ? `(${totalVotes})` : ''}
      </p>
      {totalVotes === 0 ? (
        <p className="text-gray-500 text-xs text-center py-1">Esperando respuestas...</p>
      ) : (
        <div className="space-y-1.5">
          {currentQuestion.options.map((_, idx) => {
            if (hiddenOptions.has(idx)) return null;
            const pct = Math.round((audienceData[idx] / totalVotes) * 100);
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{OPTION_LABELS[idx]}</span>
                <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    className={`h-full rounded-full ${OPTION_BAR_COLORS[idx]}`}
                  />
                </div>
                <span className="text-xs text-gray-300 w-12 text-right">{audienceData[idx]} · {pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  const answeredMsgEl = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 text-center flex-shrink-0"
    >
      <p className="text-green-400 font-semibold text-sm">✓ Respuesta registrada</p>
      <p className="text-gray-400 text-xs mt-0.5">Esperando al host...</p>
    </motion.div>
  );

  const questionCardEl = (extraClass = '') => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card-glow p-4 text-center flex-shrink-0 ${extraClass}`}
    >
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
        Pregunta {currentQuestionIndex + 1}/{questions.length}
      </p>
      <h2 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {currentQuestion.text}
      </h2>
      <p className="text-gray-500 text-xs mt-1">Máx: {currentQuestion.points.toLocaleString()} pts</p>
    </motion.div>
  );

  return (
    <div className="h-screen overflow-hidden p-3 flex flex-col landscape:flex-row gap-2 landscape:gap-3 relative">

      {/* Corner logos */}
      <img src="/LOGO_QQSM.png" alt="QQSM" className="absolute top-2 left-2 h-12 w-auto object-contain opacity-90 pointer-events-none z-10" />
      <img src="/LogoFondo_Transparente_Blanco.png" alt="Gen Hoot" className="absolute top-2 right-2 h-12 w-auto object-contain opacity-90 pointer-events-none z-10" />

      {/* ── Section A: timer + lifelines + question ── */}
      <div className="flex flex-col gap-2 landscape:w-[44%] landscape:min-h-0">
        {/* Header */}
        <div className="flex items-center justify-center flex-shrink-0">
          {timerEl}
        </div>

        {/* Lifelines */}
        {!isLocked && lifelinesEl}

        {/* Audience data */}
        <AnimatePresence>{audiencePanelEl}</AnimatePresence>

        {/* Question: fills remaining space in landscape */}
        {questionCardEl('landscape:flex-1 landscape:flex landscape:flex-col landscape:justify-center')}

        {/* Answered msg — only in landscape (right side handles portrait) */}
        <div className="portrait:hidden">
          <AnimatePresence>{hasAnswered && answeredMsgEl}</AnimatePresence>
        </div>
      </div>

      {/* ── Section B: 2x2 answer grid ── */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1 min-h-0">
          {currentQuestion.options.map((option, idx) => {
            const hidden = hiddenOptions.has(idx);
            const selected = hasAnswered && myAnswer.answerIndex === idx;
            const dimmed = hasAnswered && !selected;

            if (hidden) {
              return <div key={idx} className="rounded-2xl bg-white/5 opacity-20" />;
            }

            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08 }}
                whileTap={!isLocked ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(idx)}
                disabled={isLocked}
                className={`
                  ${OPTION_CLASSES[idx]}
                  ${selected ? 'answer-btn-selected' : ''}
                  ${dimmed ? 'opacity-40' : ''}
                  rounded-2xl text-left flex flex-col justify-between p-3 h-full
                  transition-opacity duration-200
                `}
              >
                <span className="text-base">{OPTION_ICONS[idx]}</span>
                <span className="font-bold text-white text-xs leading-tight">
                  {OPTION_LABELS[idx]}. {option}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Answered msg — only in portrait */}
        <div className="landscape:hidden flex-shrink-0">
          <AnimatePresence>{hasAnswered && answeredMsgEl}</AnimatePresence>
        </div>
      </div>

      {/* Time's up — fixed overlay */}
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
      </AnimatePresence>
    </div>
  );
}
