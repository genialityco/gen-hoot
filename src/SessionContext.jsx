import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createSession, registerPlayer, updatePlayerConnection,
  subscribeToSession, updateQuestions, deleteSession,
  startQuiz, showQuestionResults, showLeaderboard, nextQuestion, finishQuiz, resetSession,
  submitAnswer,
} from './firebase';

const SessionContext = createContext(null);

const STORAGE_KEYS = {
  code: 'quiz-code',
  playerId: 'quiz-playerId',
  isHost: 'quiz-isHost',
  hostId: 'quiz-hostId',
};

export function SessionProvider({ children }) {
  const [sessionCode, setSessionCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [sessionState, setSessionState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const code = sessionStorage.getItem(STORAGE_KEYS.code);
    const pid = sessionStorage.getItem(STORAGE_KEYS.playerId);
    const host = sessionStorage.getItem(STORAGE_KEYS.isHost) === 'true';
    const hid = sessionStorage.getItem(STORAGE_KEYS.hostId);
    if (code) {
      setSessionCode(code);
      setPlayerId(pid);
      setIsHost(host);
      setHostId(hid);
    }
  }, []);

  // Persist to sessionStorage when values change
  useEffect(() => {
    if (sessionCode) {
      sessionStorage.setItem(STORAGE_KEYS.code, sessionCode);
      sessionStorage.setItem(STORAGE_KEYS.playerId, playerId || '');
      sessionStorage.setItem(STORAGE_KEYS.isHost, String(isHost));
      sessionStorage.setItem(STORAGE_KEYS.hostId, hostId || '');
    }
  }, [sessionCode, playerId, isHost, hostId]);

  // Subscribe to Firebase — auto-clear state if session is deleted externally
  useEffect(() => {
    if (!sessionCode) return;
    const unsub = subscribeToSession(sessionCode, (data) => {
      if (data === null) {
        Object.values(STORAGE_KEYS).forEach((k) => sessionStorage.removeItem(k));
        setSessionCode(null);
        setPlayerId(null);
        setHostId(null);
        setIsHost(false);
        setSessionState(null);
        setError(null);
      } else {
        setSessionState(data);
      }
    });
    return () => unsub();
  }, [sessionCode]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const phase = sessionState?.phase || 'lobby';
  const currentQuestionIndex = sessionState?.currentQuestionIndex ?? 0;
  const questions = sessionState?.questions
    ? Object.values(sessionState.questions)
    : [];
  const currentQuestion = questions[currentQuestionIndex] || null;
  const players = sessionState?.players
    ? Object.entries(sessionState.players).map(([id, d]) => ({ id, ...d }))
    : [];
  const leaderboard = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const myAnswer = sessionState?.answers?.[currentQuestionIndex]?.[playerId] || null;
  const myScore = sessionState?.players?.[playerId]?.score ?? 0;
  const myRank = leaderboard.findIndex((p) => p.id === playerId) + 1;
  const totalAnswers = sessionState?.answers?.[currentQuestionIndex]
    ? Object.keys(sessionState.answers[currentQuestionIndex]).length
    : 0;

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCreateSession = useCallback(async (hostName, questionsList) => {
    setLoading(true);
    setError(null);
    try {
      const { code, hostId: hid } = await createSession(hostName, questionsList);
      setSessionCode(code);
      setHostId(hid);
      setIsHost(true);
      setPlayerId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRegisterPlayer = useCallback(async (code, name, email) => {
    setLoading(true);
    setError(null);
    try {
      const { playerId: pid, code: resolvedCode } = await registerPlayer(code, name, email);
      setSessionCode(resolvedCode);
      setPlayerId(pid);
      setIsHost(false);
      setHostId(null);

      // Mark connected on disconnect
      updatePlayerConnection(resolvedCode, pid, true).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateQuestions = useCallback(async (questionsList) => {
    if (!sessionCode) return;
    try {
      await updateQuestions(sessionCode, questionsList);
    } catch (e) {
      setError(e.message);
    }
  }, [sessionCode]);

  const handleStartQuiz = useCallback(async () => {
    if (!sessionCode) return;
    setError(null);
    try { await startQuiz(sessionCode); } catch (e) { setError(e.message); }
  }, [sessionCode]);

  const handleShowQuestionResults = useCallback(async () => {
    if (!sessionCode) return;
    try { await showQuestionResults(sessionCode); } catch (e) { setError(e.message); }
  }, [sessionCode]);

  const handleShowLeaderboard = useCallback(async () => {
    if (!sessionCode) return;
    try { await showLeaderboard(sessionCode); } catch (e) { setError(e.message); }
  }, [sessionCode]);

  const handleNextQuestion = useCallback(async () => {
    if (!sessionCode) return;
    try { await nextQuestion(sessionCode); } catch (e) { setError(e.message); }
  }, [sessionCode]);

  const handleFinishQuiz = useCallback(async () => {
    if (!sessionCode) return;
    try { await finishQuiz(sessionCode); } catch (e) { setError(e.message); }
  }, [sessionCode]);

  const handleResetSession = useCallback(async () => {
    if (!sessionCode) return;
    try { await resetSession(sessionCode); } catch (e) { setError(e.message); }
  }, [sessionCode]);

  const handleSubmitAnswer = useCallback(async (questionIndex, answerIndex) => {
    if (!sessionCode || !playerId) return;
    try { await submitAnswer(sessionCode, playerId, questionIndex, answerIndex); }
    catch (e) { setError(e.message); }
  }, [sessionCode, playerId]);

  const handleCancelSession = useCallback(async () => {
    const code = sessionCode;
    Object.values(STORAGE_KEYS).forEach((k) => sessionStorage.removeItem(k));
    setSessionCode(null);
    setPlayerId(null);
    setHostId(null);
    setIsHost(false);
    setSessionState(null);
    setError(null);
    if (code) {
      try { await deleteSession(code); } catch { /* session already gone */ }
    }
  }, [sessionCode]);

  const handleLeaveSession = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((k) => sessionStorage.removeItem(k));
    setSessionCode(null);
    setPlayerId(null);
    setHostId(null);
    setIsHost(false);
    setSessionState(null);
    setError(null);
  }, []);

  const value = {
    // Identity
    sessionCode, playerId, hostId, isHost,
    // Raw state
    sessionState,
    // Derived
    phase, currentQuestionIndex, questions, currentQuestion,
    players, leaderboard, myAnswer, myScore, myRank, totalAnswers,
    // Status
    error, loading, setError,
    // Actions
    createSession: handleCreateSession,
    registerPlayer: handleRegisterPlayer,
    updateQuestions: handleUpdateQuestions,
    startQuiz: handleStartQuiz,
    showQuestionResults: handleShowQuestionResults,
    showLeaderboard: handleShowLeaderboard,
    nextQuestion: handleNextQuestion,
    finishQuiz: handleFinishQuiz,
    resetSession: handleResetSession,
    submitAnswer: handleSubmitAnswer,
    cancelSession: handleCancelSession,
    leaveSession: handleLeaveSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => useContext(SessionContext);
