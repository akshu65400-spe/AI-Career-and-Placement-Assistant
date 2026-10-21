import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const EMOJIS = ["🤖", "🧑‍💻", "👨‍🏫", "🦊", "👽", "🦉", "🧑‍🚀", "🐼"];
const DIFFICULTIES = [
  { label: "Beginner", api: "Easy" },
  { label: "Intermediate", api: "Medium" },
  { label: "Advanced", api: "Hard" },
];
const INTERVIEW_ROUNDS = ["HR", "Technical", "Coding"];

function getSavedResumeAnalysis() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const key = `resumeAnalysis:${user?.id ?? "guest"}`;
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    return saved?.resume_text ? saved : null;
  } catch {
    return null;
  }
}

export default function Interview({ interviewMode = "written" }) {
  const mode = interviewMode;
  const navigate = useNavigate();
  const [role, setRole] = useState("Software Developer");
  const [interviewRound, setInterviewRound] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [resumeAnalysis, setResumeAnalysis] = useState(getSavedResumeAnalysis);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [emoji, setEmoji] = useState("🤖");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [skills, setSkills] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const recognitionRef = useRef(null);
  const lastSpokenRef = useRef("");
  const question = questions[questionIndex] || "";
  const apiDifficulty = DIFFICULTIES.find((item) => item.label === difficulty)?.api || "Easy";
  const averageScore = results.length
    ? Math.round(results.reduce((total, item) => total + item.score, 0) / results.length)
    : 0;

  // Refresh saved analysis when returning from Resume AI in the same tab.
  useEffect(() => {
    const refresh = () => setResumeAnalysis(getSavedResumeAnalysis());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const speakQuestion = (text) => {
    if (!text || !("speechSynthesis" in window)) {
      setFeedback("Speech is unavailable. Read the question on screen.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const startInterview = async () => {
    // Re-read storage in case Resume AI was analyzed just before this click.
    const saved = getSavedResumeAnalysis();
    setResumeAnalysis(saved);
    if (!saved?.resume_text) {
      setFeedback("First open Resume AI, upload and analyze your resume once. Then return here—there is no separate interview uploader.");
      return;
    }

    setLoading(true);
    setFeedback("");
    setQuestions([]);
    setResults([]);
    setSkills([]);
    setAnswer("");
    setQuestionIndex(0);
    setFinished(false);
    lastSpokenRef.current = "";
    stopSpeech();

    try {
      // Each route gets questions personalized from the same saved Resume AI analysis.
      const response = await api.post("/interview/start-from-resume-data", {
        resume_text: saved.resume_text,
        role,
        difficulty: apiDifficulty,
        interview_round: interviewRound,
      });
      const data = response.data;
      const receivedQuestions = Array.isArray(data.questions) ? data.questions : [];
      if (!receivedQuestions.length) throw new Error("The backend returned no questions.");
      setQuestions(receivedQuestions);
      setSkills(data.detected_skills || saved.skills || []);
      setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
      setTimeLeft(120);
      setQuestionIndex(0);
      setStarted(true);
    } catch (error) {
      console.error("Start interview failed:", error);
      setFeedback(error.response?.data?.detail || error.message || "Could not start the interview. Check the backend terminal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!started || mode !== "mock" || !question || finished) return;
    if (lastSpokenRef.current === question) return;
    lastSpokenRef.current = question;
    speakQuestion(question);
  }, [started, mode, question, finished]);

  useEffect(() => {
    if (!started || finished || loading) return;
    setTimeLeft(120);
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, questionIndex, finished, loading]);

  useEffect(() => {
    if (!started || loading || timeLeft !== 0) return;
    if (mode === "mock") {
      stopSpeech();
      if (recognitionRef.current) recognitionRef.current.abort();
      setListening(false);
    }

    setAnswer("");
    if (questionIndex >= questions.length - 1) {
      setStarted(false);
      setFinished(true);
      setFeedback("Time is up for the final question. Your interview has ended.");
      return;
    }

    setFeedback("Time is up for this question. Moving to the next question.");
    setTimeLeft(120);
    setQuestionIndex((previous) => previous + 1);
  }, [started, loading, mode, timeLeft, questionIndex, questions.length]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback("Voice input is unsupported in this browser. Use a browser with speech recognition to answer mock questions.");
      return;
    }
    stopSpeech();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => { setListening(true); setFeedback("Listening... Speak your answer."); };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setAnswer(transcript);
    };
    recognition.onerror = (event) => {
      console.error("Voice input error:", event.error);
      setListening(false);
      setFeedback("Microphone error. Check browser permissions or type your answer.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); }
    catch (error) {
      console.error(error);
      setListening(false);
      setFeedback("Could not start the microphone. Please try again.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setFeedback("Please enter or speak an answer first.");
      return;
    }
    if (listening) stopListening();
    stopSpeech();
    setLoading(true);
    setFeedback("");
    try {
      const response = await api.post(
        mode === "mock" ? "/interview/mock/evaluate" : "/interview/evaluate",
        mode === "mock"
          ? { role, difficulty: apiDifficulty, question, answer: answer.trim(), question_number: questionIndex + 1 }
          : { difficulty, category: role, question, answer: answer.trim() }
      );
      const data = response.data;
      const rawScore = Number(data.score ?? 0);
      const score = Math.max(0, Math.min(100, mode === "mock" ? rawScore * 10 : rawScore));
      const improvement = data.improvement || (Array.isArray(data.improvements) ? data.improvements.join(" ") : "");
      const result = { question, answer: answer.trim(), score, feedback: data.feedback || "Answer evaluated.", improvement };
      const updated = [...results, result];
      setResults(updated);
      setAnswer("");
      if (questionIndex >= questions.length - 1) {
        setStarted(false);
        setFinished(true);
        setFeedback(`Interview completed. Your average score is ${Math.round(updated.reduce((total, item) => total + item.score, 0) / updated.length)}%.`);
      } else {
        setQuestionIndex((previous) => previous + 1);
        setFeedback(`${score}% — ${result.feedback}${improvement ? ` Improvement: ${improvement}` : ""}`);
      }
    } catch (error) {
      console.error("Answer evaluation failed:", error);
      setFeedback(error.response?.data?.detail || "Could not evaluate your answer. Check the backend endpoint.");
    } finally {
      setLoading(false);
    }
  };

  const endInterview = () => {
    stopSpeech();
    if (recognitionRef.current) recognitionRef.current.abort();
    setListening(false);
    setStarted(false);
    setFinished(false);
    setQuestions([]);
    setQuestionIndex(0);
    setAnswer("");
    setResults([]);
    setSkills([]);
    setFeedback("");
    lastSpokenRef.current = "";
  };

  const switchInterview = (event, path) => {
    if (!started) return;
    event.preventDefault();
    const currentMode = mode === "mock" ? "Mock Interview" : "Written Interview";
    if (window.confirm(`End the current ${currentMode} and switch? Its progress will be lost.`)) {
      endInterview();
      navigate(path);
    }
  };

  const startAnother = () => {
    setFinished(false);
    setFeedback("");
    setResults([]);
    setQuestions([]);
    setAnswer("");
  };

  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="interview-page">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">AI</div>
          <div><h2>CareerAI</h2><span>Placement Assistant</span></div>
        </div>
        <nav>
          <Link to="/dashboard">📊 Dashboard</Link>
          <Link to="/profile">👤 My Profile</Link>
          <Link to="/resume">📄 Resume AI</Link>
          <Link to="/jobs">💼 Jobs</Link>
          <Link to="/applications">📋 Applications</Link>
          <Link to="/interview" onClick={(event) => mode !== "written" && switchInterview(event, "/interview")} className={mode === "written" ? "active" : ""}>✍️ Written Interview</Link>
          <Link to="/mock-interview" onClick={(event) => mode !== "mock" && switchInterview(event, "/mock-interview")} className={mode === "mock" ? "active" : ""}>🎤 Mock Interview</Link>
        </nav>
        <button className="logout-button" onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }}>🚪 Logout</button>
      </aside>

      <main className="interview-content">
        <header className="interview-header">
          <div><span className="page-badge">AI POWERED</span><h1>{mode === "mock" ? "Mock Interview" : "Written Interview"}</h1><p>{mode === "mock" ? "Practice answering aloud with voice recognition. You get 2 minutes for each question." : "Practice written answers to resume-based questions. You get 2 minutes for each question."}</p></div>
          <div className="interview-robot">🤖</div>
        </header>

        <section className="interview-stats">
          <div className="interview-stat"><div className="stat-symbol">🎯</div><div><span>Interview Score</span><strong>{results.length ? `${averageScore}%` : "--"}</strong></div></div>
          <div className="interview-stat"><div className="stat-symbol">✅</div><div><span>Questions Answered</span><strong>{results.length}</strong></div></div>
          <div className="interview-stat"><div className="stat-symbol">📄</div><div><span>Resume Skills Found</span><strong>{resumeAnalysis?.skills?.length || skills.length}</strong></div></div>
        </section>

        <section className="interview-grid">
          <div className={`interview-card main-interview-card ${mode}-mode`}>
            <div className="card-icon">{mode === "mock" ? "🎤" : "✍️"}</div>
            <h2>{mode === "mock" ? "Resume-Based Mock Interview" : "Resume-Based Written Interview"} · {interviewRound} Round</h2>

            {!started && !finished && <>
              <h3>Job Role</h3>
              <input className="interview-role-input" value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Software Developer" />

              <h3>Interview Round</h3>
              <div className="difficulty-options" role="group" aria-label="Interview round">
                {INTERVIEW_ROUNDS.map((item) => <button key={item} type="button" className={`difficulty ${interviewRound === item ? "selected" : ""}`} onClick={() => setInterviewRound(item)}>{item === "HR" ? "HR Round" : `${item} Round`}</button>)}
              </div>

              <h3>Difficulty</h3>
              <div className="difficulty-options">
                {DIFFICULTIES.map((item) => <button key={item.label} className={`difficulty ${difficulty === item.label ? "selected" : ""}`} onClick={() => setDifficulty(item.label)}>{item.label}</button>)}
              </div>

              <button className="start-interview-button" onClick={startInterview} disabled={loading || !resumeAnalysis?.resume_text}>
                {loading ? "Preparing interview..." : mode === "mock" ? "Start Mock Interview →" : "Start Written Interview →"}
              </button>
              {!resumeAnalysis && <p className="resume-required-note">Analyze your resume in Resume AI first. This page has no uploader by design.</p>}
            </>}

            {started && <div className="interview-started">
              {mode === "mock" && <>
                <div className="emoji-interviewer"><div className={`interviewer-avatar ${speaking ? "speaking" : ""}`}>{emoji}</div><h3>{speaking ? "Interviewer is speaking..." : "Your Resume Interviewer"}</h3><p>Questions use the resume saved by Resume AI.</p></div>
              </>}
              {skills.length > 0 && <div className="resume-skills"><strong>Skills detected:</strong><div className="skill-chips">{skills.map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}</div></div>}
              <div className="interview-timer">⏱️ Time Left: {formatTime(timeLeft)}</div>
              <div className="question-number">QUESTION {questionIndex + 1} OF {questions.length}</div>
              <h2 className="question-text">{question}</h2>
              <textarea rows={6} value={answer} onChange={(event) => setAnswer(event.target.value)} readOnly={mode === "mock"} placeholder={mode === "mock" ? "Your spoken answer transcript will appear here. Use Start Speaking." : "Write your answer here..."} />
              {mode === "mock" && <div className="answer-actions"><button className="secondary-button" onClick={() => speakQuestion(question)}>🔊 Listen Again</button>{!listening ? <button className="secondary-button" onClick={startListening}>🎤 Start Speaking</button> : <button className="secondary-button" onClick={stopListening}>⏹ Stop Speaking</button>}</div>}
              {feedback && <div className="answer-feedback" role="status">{feedback}</div>}
              <div className="answer-actions"><button className="secondary-button" onClick={endInterview}>End Interview</button><button className="start-interview-button" onClick={submitAnswer} disabled={loading || (mode === "mock" && timeLeft === 0)}>{loading ? "Evaluating..." : "Submit Answer →"}</button></div>
            </div>}

            {finished && <div className="final-result"><div className="result-emoji">🎉</div><h2>Interview Completed!</h2><p>{feedback}</p><div className="final-score">{averageScore}%</div>{results.map((item, index) => <div className="result-item" key={`${index}-${item.question}`}><strong>Q{index + 1}: {item.question}</strong><p>Your answer: {item.answer}</p><p>Score: {item.score}%</p><p>{item.feedback}</p>{item.improvement && <p>Suggestion: {item.improvement}</p>}</div>)}<button className="start-interview-button" onClick={startAnother}>Start Another Interview →</button></div>}
            {!started && !finished && feedback && <div className="answer-feedback" role="alert">{feedback}</div>}
          </div>

          <div className="interview-card tips-card"><h2>💡 Interview Tips</h2>{[["Be Clear", "Keep your answers structured and understandable."], ["Use Examples", "Explain your role in the projects on your resume."], ["Stay Confident", "Take a moment to think before answering."], ["Practice Regularly", "Use feedback to improve your answers."]].map(([title, description], index) => <div className="tip-item" key={title}><div className="tip-icon">{index + 1}</div><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
        </section>

        <section className="interview-card categories-card"><h2>How the personalized interview works</h2><p>Resume AI extracts readable resume text and detects skills. Both interview modes use that same saved analysis to generate questions about your background, projects, and technologies.</p></section>
      </main>
    </div>
  );
}
