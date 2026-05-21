import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const AVATAR_COLORS = [
  'bg-purple-500','bg-pink-500','bg-amber-500','bg-green-500',
  'bg-blue-500','bg-red-500','bg-indigo-500','bg-teal-500',
];

export default function WaitingScreen() {
  const { sessionCode, players, playerId } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-5xl mb-4 inline-block"
        >
          ⏳
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Esperando al host...
        </h2>
        <p className="text-gray-400 text-sm mb-6">El quiz empezará en cualquier momento</p>

        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 font-medium">Sala</h3>
            <span className="font-mono font-bold text-white tracking-widest animate-pulse-glow">
              {sessionCode}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Jugadores conectados</span>
            <span className="badge bg-purple-600 text-white">{players.length}</span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`player-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} ${
                  player.id === playerId ? 'ring-2 ring-white' : ''
                }`}
                title={player.name}
              >
                {player.name[0].toUpperCase()}
              </motion.div>
            ))}
          </div>

          {players.find((p) => p.id === playerId) && (
            <p className="text-green-400 text-xs mt-3">
              ✓ Estás en la sala como{' '}
              <span className="font-bold">{players.find((p) => p.id === playerId)?.name}</span>
            </p>
          )}
        </div>

        <div className="flex gap-1 justify-center">
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, delay: d, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-purple-400"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
