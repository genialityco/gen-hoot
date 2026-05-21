import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';
import { defaultQuestions } from '../../defaultQuestions';

const EMPTY_QUESTION = () => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: 20,
  points: 1000,
});

function isValid(q) {
  return q.text.trim() && q.options.every((o) => o.trim());
}

export default function HostSetupScreen() {
  const { createSession, loading, error } = useSession();
  const [hostName, setHostName] = useState('');
  const [questions, setQuestions] = useState(defaultQuestions.map((q) => ({ ...q, options: [...q.options] })));
  const [expandedIdx, setExpandedIdx] = useState(null);

  const allValid = hostName.trim() && questions.length > 0 && questions.every(isValid);

  function updateQuestion(idx, field, value) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function updateOption(qIdx, optIdx, value) {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  }

  function moveUp(idx) {
    if (idx === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx) {
    setQuestions((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, EMPTY_QUESTION()]);
    setExpandedIdx(questions.length);
  }

  async function handleCreate() {
    if (!allValid) return;
    await createSession(hostName.trim(), questions);
  }

  const LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎛️</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Configurar sesión
            </span>
          </h1>
        </div>

        {/* Host name */}
        <div className="glass-card p-5 mb-6">
          <label className="text-gray-300 text-sm font-medium mb-2 block">Tu nombre (host)</label>
          <input
            className="input-field w-full"
            placeholder="Ej. Juan"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            maxLength={30}
          />
        </div>

        {/* Questions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-gray-200 font-semibold text-lg">
            Preguntas <span className="badge bg-purple-600 text-white ml-2">{questions.length}</span>
          </h2>
          <button className="btn-secondary text-sm py-2 px-4" onClick={addQuestion}>
            + Agregar pregunta
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              layout
              className={`glass-card p-4 ${!isValid(q) ? 'border border-red-500/40' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400 font-mono text-sm w-6">{idx + 1}.</span>
                <span
                  className="flex-1 text-gray-200 text-sm truncate cursor-pointer"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                >
                  {q.text || <span className="text-gray-500 italic">Sin pregunta</span>}
                </span>
                <div className="flex gap-1">
                  <button
                    className="text-gray-400 hover:text-white px-1"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                  >▲</button>
                  <button
                    className="text-gray-400 hover:text-white px-1"
                    onClick={() => moveDown(idx)}
                    disabled={idx === questions.length - 1}
                  >▼</button>
                  <button
                    className="text-gray-400 hover:text-red-400 px-1"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  >✏️</button>
                  <button
                    className="text-gray-400 hover:text-red-400 px-1"
                    onClick={() => removeQuestion(idx)}
                  >✕</button>
                </div>
              </div>

              {expandedIdx === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-3"
                >
                  <input
                    className="input-field w-full text-sm"
                    placeholder="Texto de la pregunta"
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                    maxLength={200}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={q.correctIndex === oi}
                          onChange={() => updateQuestion(idx, 'correctIndex', oi)}
                          className="accent-green-500"
                          title="Respuesta correcta"
                        />
                        <span className={`text-xs font-bold ${
                          ['text-red-400','text-blue-400','text-amber-400','text-green-400'][oi]
                        }`}>{LABELS[oi]}</span>
                        <input
                          className="input-field flex-1 text-sm py-1"
                          placeholder={`Opción ${LABELS[oi]}`}
                          value={opt}
                          onChange={(e) => updateOption(idx, oi, e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 items-center">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Tiempo (seg)</label>
                      <input
                        type="number"
                        className="input-field w-20 text-sm"
                        value={q.timeLimit}
                        min={5}
                        max={120}
                        onChange={(e) => updateQuestion(idx, 'timeLimit', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Puntos máx</label>
                      <input
                        type="number"
                        className="input-field w-24 text-sm"
                        value={q.points}
                        min={100}
                        max={5000}
                        step={100}
                        onChange={(e) => updateQuestion(idx, 'points', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          className="btn-primary w-full text-lg"
          onClick={handleCreate}
          disabled={!allValid || loading}
        >
          {loading ? 'Creando sesión...' : '🚀 Crear sesión'}
        </button>
      </motion.div>
    </div>
  );
}
