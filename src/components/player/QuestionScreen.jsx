import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../../SessionContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_CLASSES = ['answer-btn-a', 'answer-btn-b', 'answer-btn-c', 'answer-btn-d'];
const OPTION_ICONS = ['🔴', '🔵', '🟡', '🟢'];

const CIRCUMFERENCE = 2 * Math.PI * 36;

export default function QuestionScreen() {
  const {
    sessionState, currentQuestion, currentQuestionIndex,
    questions, submitAnswer, myAnswer,
  } = useSession();

  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit || 20);
  const [timesUp, setTimesUp] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!currentQuestion || !sessionState?.questionStartedAt) return;
    const startedAt = sessionState.questionStartedAt;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimesUp(false);

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

  function handleAnswer(idx) {
    if (isLocked) return;
    submitAnswer(currentQuestionIndex, idx);
  }

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
          const selected = hasAnswered && myAnswer.answerIndex === idx;
          const dimmed = hasAnswered && !selected;

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
