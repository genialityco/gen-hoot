import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SessionProvider, useSession } from './SessionContext';
import LandingScreen from './components/LandingScreen';

// Host components
import HostSetupScreen from './components/host/HostSetupScreen';
import HostLobbyScreen from './components/host/HostLobbyScreen';
import HostQuestionScreen from './components/host/HostQuestionScreen';
import HostAnswerResultScreen from './components/host/HostAnswerResultScreen';
import HostLeaderboardScreen from './components/host/HostLeaderboardScreen';

// Player components
import RegistrationScreen from './components/player/RegistrationScreen';
import WaitingScreen from './components/player/WaitingScreen';
import QuestionScreen from './components/player/QuestionScreen';
import AnswerResultScreen from './components/player/AnswerResultScreen';
import LeaderboardScreen from './components/player/LeaderboardScreen';

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

function HostRouter() {
  const { sessionCode, phase } = useSession();

  let screenKey;
  let Screen;
  if (!sessionCode) {
    screenKey = 'setup';
    Screen = <HostSetupScreen />;
  } else {
    screenKey = phase;
    switch (phase) {
      case 'lobby':            Screen = <HostLobbyScreen />; break;
      case 'showing-question': Screen = <HostQuestionScreen />; break;
      case 'question-results': Screen = <HostAnswerResultScreen />; break;
      case 'leaderboard':      Screen = <HostLeaderboardScreen isFinal={false} />; break;
      case 'finished':         Screen = <HostLeaderboardScreen isFinal={true} />; break;
      default:                 Screen = <HostLobbyScreen />;
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screenKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25 }}
      >
        {Screen}
      </motion.div>
    </AnimatePresence>
  );
}

function PlayerRouter() {
  const { playerId, phase } = useSession();

  let screenKey;
  let Screen;
  if (!playerId) {
    screenKey = 'registration';
    Screen = <RegistrationScreen />;
  } else {
    screenKey = phase;
    switch (phase) {
      case 'lobby':            Screen = <WaitingScreen />; break;
      case 'showing-question': Screen = <QuestionScreen />; break;
      case 'question-results': Screen = <AnswerResultScreen />; break;
      case 'leaderboard':      Screen = <LeaderboardScreen isFinal={false} />; break;
      case 'finished':         Screen = <LeaderboardScreen isFinal={true} />; break;
      default:                 Screen = <WaitingScreen />;
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screenKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25 }}
      >
        {Screen}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route
          path="/host/*"
          element={
            <SessionProvider>
              <HostRouter />
            </SessionProvider>
          }
        />
        <Route
          path="/join/*"
          element={
            <SessionProvider>
              <PlayerRouter />
            </SessionProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
