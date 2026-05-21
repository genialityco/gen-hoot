import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_CLASSES = ['answer-btn-a', 'answer-btn-b', 'answer-btn-c', 'answer-btn-d'];
const OPTION_ICONS = ['🔴', '🔵', '🟡', '🟢'];

const CIRCUMFERENCE = 2 * Math.PI * 36;

export default function HostQuestionScreen() {
  const {
    sessionState, currentQuestion, currentQuestionIndex,
    questions, players, totalAnswers, showQuestionResults, cancelSession,
  } = useSession();

  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit || 20);
  const timerRef = useRef(null);
  const startedAtRef = useRef(sessionState?.questionStartedAt);

  useEffect(() => {
    if (!currentQuestion || !sessionState?.questionStartedAt) return;
    startedAtRef.current = sessionState.questionStartedAt;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));
      if (remaining <= 0) clearInterval(timerRef.current);
    }, 200);

    return () => clearInterval(timerRef.current);
  }, [currentQuestion, sessionState?.questionStartedAt]);

  if (!currentQuestion) return null;

  const ratio = timeLeft / currentQuestion.timeLimit;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const timerColor = ratio > 0.5 ? '#7c3aed' : ratio > 0.25 ? '#f59e0b' : '#ef4444';
  const isUrgent = timeLeft <= Math.ceil(currentQuestion.timeLimit * 0.25);

  const answered = totalAnswers;
  const total = players.length;

  return (
    <div className="min-h-screen p-6 flex flex-col items-center max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="glass-card px-4 py-2">
          <span className="text-gray-400 text-sm">Pregunta </span>
          <span className="text-white font-bold">{currentQuestionIndex + 1}</span>
          <span className="text-gray-400 text-sm"> / {questions.length}</span>
        </div>

        {/* Timer ring */}
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

        <div className="glass-card px-4 py-2 text-right">
          <p className="text-white font-bold text-lg">{answered}/{total}</p>
          <p className="text-gray-400 text-xs">respondieron</p>
        </div>
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-glow p-8 w-full text-center mb-8"
      >
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-3">Pregunta</p>
        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {currentQuestion.text}
        </h2>
      </motion.div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        {currentQuestion.options.map((option, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`${OPTION_CLASSES[idx]} p-5 rounded-2xl text-center cursor-default`}
          >
            <div className="text-2xl mb-1">{OPTION_ICONS[idx]}</div>
            <p className="font-bold text-lg text-white">{OPTION_LABELS[idx]}. {option}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full glass-card p-3 mb-6">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            animate={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-gray-400 text-xs mt-1 text-center">
          {answered} de {total} jugadores respondieron
        </p>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button className="btn-primary text-lg flex-1" onClick={showQuestionResults}>
          Mostrar resultados →
        </button>
        <button className="btn-secondary px-4" onClick={cancelSession} title="Cancelar sesión">
          ✕
        </button>
      </div>
    </div>
  );
}
