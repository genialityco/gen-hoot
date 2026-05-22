import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../SessionContext';

const AVATAR_COLORS = [
  'bg-purple-500','bg-pink-500','bg-amber-500','bg-green-500',
  'bg-blue-500','bg-red-500','bg-indigo-500','bg-teal-500',
];

export default function WaitingScreen() {
  const { sessionCode, players, playerId } = useSession();
  const myPlayer = players.find((p) => p.id === playerId);

  return (
    <div className="h-screen overflow-hidden flex flex-col p-3 gap-2">
      {/* Header logos */}
      <div className="flex items-center justify-between flex-shrink-0">
        <img src="/LOGO_QQSM.png" alt="QQSM" className="h-10 w-auto object-contain" />
        <img src="/LogoFondo_Transparente_Blanco.png" alt="Gen Hoot" className="h-10 w-auto object-contain opacity-90" />
      </div>

      {/* Status */}
      <div className="text-center flex-shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-4xl inline-block"
        >
          ⏳
        </motion.div>
        <h2 className="text-xl font-bold text-white mt-2" style={{ fontFamily: 'var(--font-display)' }}>
          Esperando al host...
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">El quiz empezará en cualquier momento</p>
      </div>

      {/* Session card — fills remaining space, jugadores con scroll si se acumulan */}
      <div className="glass-card p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <span className="text-gray-400 text-sm">Sala</span>
          <span className="font-mono font-bold text-white tracking-widest animate-pulse-glow">{sessionCode}</span>
        </div>
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <span className="text-gray-400 text-sm">Jugadores</span>
          <span className="badge bg-purple-600 text-white">{players.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
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
          {myPlayer && (
            <p className="text-green-400 text-xs mt-3 text-center">
              ✓ Conectado como <span className="font-bold">{myPlayer.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex gap-1 justify-center flex-shrink-0">
        {[0, 0.2, 0.4].map((d, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, delay: d, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-purple-400"
          />
        ))}
      </div>
    </div>
  );
}
