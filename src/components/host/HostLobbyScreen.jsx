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
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">

        {/* Left: code + QR */}
        <div className="glass-card-glow p-8 flex flex-col items-center text-center">
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-3">Código de sesión</p>
          <div className="text-5xl font-bold font-mono tracking-widest text-white animate-pulse-glow mb-6">
            {sessionCode}
          </div>

          <div className="qr-container mb-4">
            <QRCode value={joinUrl} size={180} />
          </div>
          <p className="text-gray-500 text-xs break-all">{joinUrl}</p>

          <p className="text-gray-300 text-sm mt-4">
            Escanea el QR o ingresa el código en{' '}
            <span className="text-purple-400 font-mono">{window.location.origin}/join</span>
          </p>
        </div>

        {/* Right: players + start */}
        <div className="flex flex-col gap-4">
          <div className="glass-card p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Jugadores</h2>
              <span className="badge bg-purple-600 text-white">{players.length} conectados</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Esperando jugadores...</p>
              ) : (
                players.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <div className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      {player.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{player.name}</p>
                      <p className="text-gray-400 text-xs">{player.email}</p>
                    </div>
                    <div className={`ml-auto w-2 h-2 rounded-full ${player.connected ? 'bg-green-400' : 'bg-gray-500'}`} />
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            className="btn-primary text-lg"
            onClick={startQuiz}
            disabled={players.length === 0 || loading}
          >
            {loading ? 'Iniciando...' : `🚀 Iniciar quiz (${players.length} jugador${players.length !== 1 ? 'es' : ''})`}
          </button>
          <button
            className="btn-secondary text-sm"
            onClick={cancelSession}
            disabled={loading}
          >
            ✕ Cancelar sesión
          </button>
        </div>
      </motion.div>
    </div>
  );
}
