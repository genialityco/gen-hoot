import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_CLASSES = ['answer-btn-a', 'answer-btn-b', 'answer-btn-c', 'answer-btn-d'];
const OPTION_ICONS = ['🔴', '🔵', '🟡', '🟢'];
const CIRCUMFERENCE = 2 * Math.PI * 36;
const AUTO_RESULT_DELAY = 2000;

export default function HostQuestionScreen() {
  const {
    sessionState, currentQuestion, currentQuestionIndex,
    questions, players, totalAnswers, sessionMode, showQuestionResults, cancelSession,
  } = useSession();

  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit || 20);
  const timerRef = useRef(null);
  const autoRef = useRef(null);
  const startedAtRef = useRef(sessionState?.questionStartedAt);
  const isAuto = sessionMode === 'auto';

  useEffect(() => {
    if (!currentQuestion || !sessionState?.questionStartedAt) return;
    startedAtRef.current = sessionState.questionStartedAt;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (isAuto && !autoRef.current) {
          autoRef.current = setTimeout(() => showQuestionResults(), AUTO_RESULT_DELAY);
        }
      }
    }, 200);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(autoRef.current);
      autoRef.current = null;
    };
  }, [currentQuestion, sessionState?.questionStartedAt, isAuto, showQuestionResults]);

  if (!currentQuestion) return null;

  const ratio = timeLeft / currentQuestion.timeLimit;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const timerColor = ratio > 0.5 ? '#7c3aed' : ratio > 0.25 ? '#f59e0b' : '#ef4444';
  const isUrgent = timeLeft <= Math.ceil(currentQuestion.timeLimit * 0.25);
  const answered = totalAnswers;
  const total = players.length;

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
          <div className="glass-card px-5 py-3">
            <span className="text-gray-400 text-sm">Pregunta </span>
            <span className="text-white font-bold text-2xl">{currentQuestionIndex + 1}</span>
            <span className="text-gray-400 text-sm"> / {questions.length}</span>
          </div>

          <div className={`timer-ring-host ${isUrgent ? 'timer-urgent' : ''}`}>
            <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle className="timer-bg" cx="40" cy="40" r="36" />
              <circle
                className="timer-progress"
                cx="40" cy="40" r="36"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                stroke={timerColor}
              />
            </svg>
            <div className="timer-text" style={{ color: timerColor, fontSize: '2.2rem' }}>{timeLeft}</div>
          </div>

          <div className="glass-card px-5 py-3 text-right">
            <p className="text-white font-bold text-2xl">
              {answered}<span className="text-gray-400 text-base font-normal">/{total}</span>
            </p>
            <p className="text-gray-400 text-xs uppercase tracking-wide">respondieron</p>
          </div>
        </div>

        {/* Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-glow px-10 py-5 text-center flex-shrink-0"
        >
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Pregunta</p>
          <h2 className="text-4xl font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
            {currentQuestion.text}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Máx: {currentQuestion.points.toLocaleString()} pts · {currentQuestion.timeLimit}s
          </p>
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0">
          {currentQuestion.options.map((option, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`${OPTION_CLASSES[idx]} rounded-2xl flex items-center gap-5 px-8 cursor-default h-full`}
            >
              <span className="text-4xl flex-shrink-0">{OPTION_ICONS[idx]}</span>
              <p className="font-bold text-2xl text-white">{OPTION_LABELS[idx]}. {option}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="glass-card flex-1 px-4 py-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                animate={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-gray-400 text-xs text-center">{answered} de {total} jugadores respondieron</p>
          </div>
          <button className="btn-primary px-8 py-3 flex-shrink-0" onClick={showQuestionResults}>
            Mostrar resultados →
          </button>
          <button className="btn-secondary px-4 py-3 flex-shrink-0" onClick={cancelSession} title="Cancelar sesión">
            ✕
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
