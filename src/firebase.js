import { initializeApp } from 'firebase/app';
import {
  getDatabase, ref, set, get, update, remove, onValue, push, onDisconnect, runTransaction
} from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateHostId() {
  return 'h_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function questionsArrayToObject(questions) {
  const obj = {};
  questions.forEach((q, i) => { obj[String(i)] = q; });
  return obj;
}

// ── Session management ──────────────────────────────────────────────────────

export async function createSession(hostName, questions, mode = 'manual') {
  const code = generateCode();
  const hostId = generateHostId();

  await set(ref(db, `sessions/${code}`), {
    code,
    hostId,
    hostName,
    mode,
    phase: 'lobby',
    currentQuestionIndex: 0,
    questionStartedAt: null,
    createdAt: Date.now(),
    questions: questionsArrayToObject(questions),
    players: {},
    answers: {},
  });

  const hostConnRef = ref(db, `sessions/${code}/hostConnected`);
  onDisconnect(hostConnRef).set(false);

  return { code, hostId };
}

export function subscribeToSession(code, callback) {
  return onValue(ref(db, `sessions/${code}`), (snap) => callback(snap.val()));
}

// ── Player registration ─────────────────────────────────────────────────────

export async function registerPlayer(code, name, email) {
  const upperCode = code.toUpperCase().trim();
  const snap = await get(ref(db, `sessions/${upperCode}`));

  if (!snap.exists()) throw new Error('Sesión no encontrada');

  const session = snap.val();
  if (session.phase !== 'lobby') throw new Error('La sesión ya inició');

  const playerRef = push(ref(db, `sessions/${upperCode}/players`));
  const playerId = playerRef.key;

  await set(playerRef, {
    name,
    email,
    score: 0,
    connected: true,
    joinedAt: Date.now(),
  });

  onDisconnect(ref(db, `sessions/${upperCode}/players/${playerId}/connected`)).set(false);

  return { playerId, code: upperCode };
}

export async function updatePlayerConnection(code, playerId, connected) {
  await update(ref(db, `sessions/${code}/players/${playerId}`), { connected });
}

// ── Question management (host setup) ────────────────────────────────────────

export async function updateQuestions(code, questions) {
  await update(ref(db, `sessions/${code}`), {
    questions: questionsArrayToObject(questions),
  });
}

export async function deleteSession(code) {
  await remove(ref(db, `sessions/${code}`));
}

// ── Quiz flow (host controls) ────────────────────────────────────────────────

export async function startQuiz(code) {
  await update(ref(db, `sessions/${code}`), {
    phase: 'showing-question',
    currentQuestionIndex: 0,
    questionStartedAt: Date.now(),
  });
}

export async function showQuestionResults(code) {
  await update(ref(db, `sessions/${code}`), { phase: 'question-results' });
}

export async function showLeaderboard(code) {
  await update(ref(db, `sessions/${code}`), { phase: 'leaderboard' });
}

export async function nextQuestion(code) {
  const snap = await get(ref(db, `sessions/${code}`));
  const session = snap.val();
  await update(ref(db, `sessions/${code}`), {
    phase: 'showing-question',
    currentQuestionIndex: session.currentQuestionIndex + 1,
    questionStartedAt: Date.now(),
  });
}

export async function finishQuiz(code) {
  await update(ref(db, `sessions/${code}`), { phase: 'finished' });
}

export async function resetSession(code) {
  const snap = await get(ref(db, `sessions/${code}`));
  const session = snap.val();
  if (!session) return;

  const updates = {
    phase: 'lobby',
    currentQuestionIndex: 0,
    questionStartedAt: null,
    answers: null,
  };

  const playerIds = Object.keys(session.players || {});
  playerIds.forEach((pid) => {
    updates[`players/${pid}/score`] = 0;
    updates[`players/${pid}/lifelinesUsed`] = null;
  });

  await update(ref(db, `sessions/${code}`), updates);
}

// ── Lifelines ─────────────────────────────────────────────────────────────────

export async function activateLifeline(code, playerId, lifelineName, data = true) {
  await update(ref(db, `sessions/${code}/players/${playerId}/lifelinesUsed`), {
    [lifelineName]: data,
  });
}

export async function getAudienceAnswers(code, questionIndex, optionCount) {
  const snap = await get(ref(db, `sessions/${code}/answers/${questionIndex}`));
  const answers = snap.val() || {};
  const counts = Array(optionCount).fill(0);
  Object.values(answers).forEach(({ answerIndex }) => {
    if (answerIndex >= 0 && answerIndex < optionCount) counts[answerIndex]++;
  });
  return counts;
}

// ── Player answer ─────────────────────────────────────────────────────────────

export async function submitAnswer(code, playerId, questionIndex, answerIndex) {
  const answerPath = `sessions/${code}/answers/${questionIndex}/${playerId}`;
  const answerRef = ref(db, answerPath);

  // Guard against double-submit
  const existing = await get(answerRef);
  if (existing.exists()) return;

  const snap = await get(ref(db, `sessions/${code}`));
  const session = snap.val();
  const question = session.questions[String(questionIndex)];

  const elapsedSeconds = (Date.now() - session.questionStartedAt) / 1000;
  const isCorrect = answerIndex === question.correctIndex;
  const timeRatio = Math.max(0, (question.timeLimit - elapsedSeconds) / question.timeLimit);
  const pointsEarned = isCorrect ? Math.round(question.points * (0.5 + 0.5 * timeRatio)) : 0;

  await set(answerRef, {
    answerIndex,
    answeredAt: Date.now(),
    isCorrect,
    pointsEarned,
  });

  if (pointsEarned > 0) {
    await runTransaction(ref(db, `sessions/${code}/players/${playerId}/score`), (current) => {
      return (current || 0) + pointsEarned;
    });
  }
}

export { db, ref, onValue, get, update, set };
