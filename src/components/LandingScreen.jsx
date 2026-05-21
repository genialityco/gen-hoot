import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCode } from 'react-qr-code';

export default function LandingScreen() {
  const navigate = useNavigate();
  const joinUrl = `${window.location.origin}/join`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-pink-600 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 relative z-10"
      >
        <div className="text-6xl mb-4 animate-float">🎯</div>
        <h1 className="text-5xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            Gen Hoot
          </span>
        </h1>
        <p className="text-gray-300 text-lg">Quiz en vivo · Compite con todos</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card-glow p-8 text-center max-w-sm w-full relative z-10"
      >
        <p className="text-gray-300 text-sm mb-4 uppercase tracking-widest font-medium">
          Escanea para unirte
        </p>
        <div className="qr-container mx-auto mb-6">
          <QRCode value={joinUrl} size={180} />
        </div>
        <p className="text-gray-400 text-xs mb-6 break-all">{joinUrl}</p>

        <div className="flex flex-col gap-3">
          <button className="btn-primary" onClick={() => navigate('/join')}>
            Unirse al quiz
          </button>
          <button className="btn-secondary" onClick={() => navigate('/host')}>
            Soy el host 🎛️
          </button>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-gray-500 text-xs mt-8 relative z-10"
      >
        Responde rápido · Acumula puntos · Gana
      </motion.p>
    </div>
  );
}
