import React, { useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Resume() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const resultKey = `resumeAnalysis:${user?.id ?? "guest"}`;

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(() => {
    try {
      const cachedResult = JSON.parse(localStorage.getItem(resultKey) || "null");
      if (!cachedResult?.score_breakdown) {
        localStorage.removeItem(resultKey);
        return null;
      }
      return cachedResult;
    } catch {
      return null;
    }
  });

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExts = [".pdf", ".doc", ".docx"];
    const hasValidExt = allowedExts.some((ext) => selectedFile.name.toLowerCase().endsWith(ext));

    if (!allowedTypes.includes(selectedFile.type) && !hasValidExt) {
      alert("Please upload a PDF or DOC/DOCX file.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  localStorage.removeItem(resultKey);
  };

  const handleInput = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyzeResume = async () => {
    if (!file) {
      alert("Please upload your resume first.");
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (user?.id) formData.append("user_id", user.id);

      const response = await api.post("/resume/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      localStorage.setItem(resultKey, JSON.stringify(response.data));
    } catch (error) {
      alert(error.response?.data?.detail || "Resume analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (

    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <Navbar title="Resume AI" />

        <section className="content-card">

          <div className="card-header">

            <div>
              <h3>AI Resume Analyzer</h3>

              <p>
                Upload your resume and get
                personalized AI feedback.
              </p>
            </div>

          </div>

          <div
            className={`upload-area ${
              dragging ? "dragging" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() =>
              setDragging(false)
            }
            onDrop={handleDrop}
          >

            <div className="upload-icon">
              📄
            </div>

            <h3>
              {file
                ? file.name
                : "Drop your resume here"}
            </h3>

            <p>
              PDF, DOC or DOCX
            </p>

            <label className="secondary-btn">

              Choose File

              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleInput}
              />

            </label>

          </div>

          <button
            className="primary-btn analyze-btn"
            onClick={analyzeResume}
            disabled={analyzing}
          >
            {analyzing
              ? "🤖 Analyzing..."
              : "✨ Analyze Resume"}
          </button>

        </section>

        {result && (

          <section className="resume-results">

            <div className="resume-score-card">

              <span>Resume Score</span>

              <div className="big-score">
                {result.score}
                <small>/100</small>
              </div>

              <p>
                {result.score >= 80
                  ? "Strong resume — keep tailoring it to each role."
                  : result.score >= 60
                    ? "Good foundation — targeted improvements can strengthen it."
                    : "Your resume needs more detail to show your experience and skills."}
              </p>

            </div>

            <div className="content-card">

              <h3>Detected Skills</h3>

              <div className="skill-tags">

                {result.skills.map(
                  (skill) => (
                    <span
                      className="skill-tag"
                      key={skill}
                    >
                      ✓ {skill}
                    </span>
                  )
                )}

              </div>

            </div>

            <div className="content-card">

              <h3>Missing Skills</h3>

              <div className="skill-tags">

                {result.missing.map(
                  (skill) => (
                    <span
                      className="skill-tag missing"
                      key={skill}
                    >
                      + {skill}
                    </span>
                  )
                )}

              </div>

            </div>

            <div className="content-card">

              <h3>AI Suggestions</h3>

              <ul className="suggestions">

                {result.suggestions.map(
                  (suggestion) => (
                    <li key={suggestion}>
                      💡 {suggestion}
                    </li>
                  )
                )}

              </ul>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default Resume;