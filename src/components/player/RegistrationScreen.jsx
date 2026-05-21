import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegistrationScreen() {
  const [searchParams] = useSearchParams();
  const { registerPlayer, loading, error, setError } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = 'El nombre es requerido';
    if (!email.trim()) errs.email = 'El email es requerido';
    else if (!isValidEmail(email)) errs.email = 'Email inválido';
    if (!code.trim()) errs.code = 'El código es requerido';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    await registerPlayer(code.toUpperCase().trim(), name.trim(), email.trim());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-glow p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎮</div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Únete al quiz
          </h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa tus datos para participar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium mb-1 block">Nombre</label>
            <input
              className={`input-field w-full ${fieldErrors.name ? 'border-red-500' : ''}`}
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoFocus
            />
            {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              className={`input-field w-full ${fieldErrors.email ? 'border-red-500' : ''}`}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={100}
            />
            {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium mb-1 block">Código de sesión</label>
            <input
              className={`input-field w-full font-mono uppercase tracking-widest text-lg ${fieldErrors.code ? 'border-red-500' : ''}`}
              placeholder="XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            {fieldErrors.code && <p className="text-red-400 text-xs mt-1">{fieldErrors.code}</p>}
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-lg mt-2" disabled={loading}>
            {loading ? 'Uniéndose...' : '¡Entrar al quiz! 🚀'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
