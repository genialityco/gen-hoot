import React from 'react';
import { motion } from 'framer-motion';
import { QRCode } from 'react-qr-code';
import { useSession } from '../../SessionContext';

const AVATAR_COLORS = [
  'bg-purple-500','bg-pink-500','bg-amber-500','bg-green-500',
  'bg-blue-500','bg-red-500','bg-indigo-500','bg-teal-500',
];

export default function HostLobbyScreen() {
  const { sessionCode, players, startQuiz, cancelSession, loading, error } = useSession();
  const joinUrl = `${window.location.origin}/join?code=${sessionCode}`;

  return (
    <div className="h-screen overflow-hidden flex flex-col p-5 gap-4 relative">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <img
          src="/LogoFondo_Transparente_Blanco.png"
          alt="Gen Hoot"
          className="h-14 w-auto object-contain"
        />

        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Código de sesión</p>
          <div className="text-4xl font-bold font-mono tracking-[0.2em] text-white animate-pulse-glow">
            {sessionCode}
          </div>
        </div>

        <button className="btn-secondary text-sm py-2 px-5" onClick={cancelSession} disabled={loading}>
          ✕ Cancelar sesión
        </button>
      </div>

      {/* Main 2-col */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left: QR */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card-glow flex flex-col items-center justify-center gap-5 p-8"
          style={{ background: 'rgba(30, 27, 75, 0.1)', backdropFilter: 'blur(4px)' }}
        >
          <img
            src="/LOGO_QQSM.png"
            alt="QQSM"
            className="h-44 w-auto object-contain"
          />
          <div className="qr-container">
            <QRCode value={joinUrl} size={200} />
          </div>
          <div className="text-center">
            <p className="text-purple-400 font-mono text-sm">{window.location.origin}/join</p>
            <p className="text-gray-500 text-xs mt-1">o ingresa el código de sesión</p>
          </div>
        </motion.div>

        {/* Right: players + actions */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="glass-card p-5 flex-1 flex flex-col min-h-0" style={{ background: 'rgba(30, 27, 75, 0.1)', backdropFilter: 'blur(4px)' }}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-white font-semibold text-lg">Jugadores</h2>
              <span className="badge bg-purple-600 text-white">{players.length} conectados</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
              {players.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="text-4xl mb-3 opacity-30">👥</div>
                  <p className="text-gray-500">Esperando jugadores...</p>
                </div>
              ) : (
                players.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                  >
                    <div className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      {player.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{player.name}</p>
                      <p className="text-gray-400 text-xs truncate">{player.email}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${player.connected ? 'bg-green-400' : 'bg-gray-500'}`} />
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="flex-shrink-0 bg-red-900/40 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            className="btn-primary text-lg py-4 flex-shrink-0"
            onClick={startQuiz}
            disabled={players.length === 0 || loading}
          >
            {loading
              ? 'Iniciando...'
              : `🚀 Iniciar quiz · ${players.length} jugador${players.length !== 1 ? 'es' : ''}`}
          </button>
        </div>
      </div>
      {/* Geniality logo — bottom right */}
      <img
        src="/LOGO-GENIALITY.png"
        alt="Geniality"
        className="absolute bottom-4 left-5 h-16 w-auto object-contain opacity-80"
      />
    </div>
  );
}
