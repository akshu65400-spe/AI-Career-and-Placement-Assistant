import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";

const MockInterview = () => {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");

  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(5);

  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);

  const recognitionRef = useRef(null);

  // Start browser speech recognition
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setAnswer(transcript);
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Start mock interview
  const startInterview = async () => {
    if (!role.trim()) {
      alert("Please enter a job role.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/interview/mock/start", {
        role,
        difficulty,
      });

      setQuestion(response.data.question);
      setStarted(true);
      setQuestionNumber(1);
      setResults([]);
      setFinished(false);
      setAnswer("");
    } catch (error) {
      console.error(error);

      // Temporary fallback question
      setQuestion(
        `Tell me about yourself and why you are interested in the ${role} role.`
      );

      setStarted(true);
      setQuestionNumber(1);
      setResults([]);
      setFinished(false);
      setAnswer("");
    } finally {
      setLoading(false);
    }
  };

  // Submit current answer
  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("Please provide an answer.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/interview/mock/evaluate", {
        role,
        difficulty,
        question,
        answer,
        question_number: questionNumber,
      });

      const evaluation = response.data;

      setResults((prev) => [...prev, evaluation]);

      if (questionNumber >= totalQuestions) {
        setFinished(true);
        setStarted(false);
        return;
      }

      setQuestion(evaluation.next_question);
      setQuestionNumber((prev) => prev + 1);
      setAnswer("");
    } catch (error) {
      console.error(error);

      alert("Unable to evaluate the answer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Final result
  if (finished) {
    const totalScore = results.reduce(
      (sum, item) => sum + Number(item.score || 0),
      0
    );

    const averageScore =
      results.length > 0 ? Math.round(totalScore / results.length) : 0;

    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-3xl font-bold mb-2">
            Mock Interview Completed
          </h1>

          <p className="text-gray-600 mb-6">
            Role: {role}
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold">
              Overall Score
            </h2>

            <p className="text-4xl font-bold mt-2">
              {averageScore}/10
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-4">
            Interview Feedback
          </h2>

          {results.map((item, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 mb-4"
            >
              <p className="font-semibold">
                Question {index + 1}
              </p>

              <p className="mt-2">
                Score: <strong>{item.score}/10</strong>
              </p>

              <p className="mt-2">
                {item.feedback}
              </p>

              {item.improvement && (
                <p className="mt-2 text-gray-600">
                  Improvement: {item.improvement}
                </p>
              )}
            </div>
          ))}

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  // Interview screen
  if (started) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">

          <div className="flex justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                AI Mock Interview
              </h1>

              <p className="text-gray-500">
                {role} • {difficulty}
              </p>
            </div>

            <div className="font-semibold">
              Question {questionNumber}/{totalQuestions}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-lg font-medium">
              {question}
            </p>
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your spoken answer will appear here..."
            className="w-full min-h-[180px] border rounded-lg p-4 mb-4"
          />

          <div className="flex gap-3 mb-6">
            {!isListening ? (
              <button
                onClick={startListening}
                className="px-5 py-3 bg-green-600 text-white rounded-lg"
              >
                🎤 Start Speaking
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="px-5 py-3 bg-red-600 text-white rounded-lg"
              >
                ⏹ Stop Speaking
              </button>
            )}
          </div>

          <button
            onClick={submitAnswer}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            {loading ? "Evaluating..." : "Submit Answer"}
          </button>
        </div>
      </div>
    );
  }

  // Start screen
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-3xl font-bold mb-2">
          AI Mock Interview
        </h1>

        <p className="text-gray-600 mb-6">
          Practice a real interview with AI.
        </p>

        <label className="block font-medium mb-2">
          Job Role
        </label>

        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Example: Software Developer"
          className="w-full border rounded-lg p-3 mb-5"
        />

        <label className="block font-medium mb-2">
          Difficulty
        </label>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full border rounded-lg p-3 mb-6"
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        <button
          onClick={startInterview}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Starting..." : "Start Mock Interview"}
        </button>

      </div>
    </div>
  );
};

export default MockInterview;