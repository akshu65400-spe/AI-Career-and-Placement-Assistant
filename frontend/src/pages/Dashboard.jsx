import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const parseSkills = (skills) => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  return String(skills)
    .split(/[\n,]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
};

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const resultKey = `resumeAnalysis:${user?.id ?? "guest"}`;
  const applicationsKey = `applications:${user?.id ?? "guest"}`;
  const [resumeAnalysis] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(resultKey) || "null");
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(applicationsKey) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user?.id) return;

    api.get(`/profile/${user.id}`)
      .then((response) => setProfile(response.data))
      .catch(() => setProfile(null));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    api.get(`/jobs/match/${user.id}`)
      .then((response) => setJobs(response.data || []))
      .catch((error) => {
        console.error("Could not load job matches:", error);
        setJobs([]);
      });
  }, [user?.id, profile?.skills, resumeAnalysis?.score]);

  const profileSkills = parseSkills(profile?.skills || resumeAnalysis?.skills);
  const hasResumeAnalysis = Number.isFinite(Number(resumeAnalysis?.score))
    && Boolean(resumeAnalysis?.score_breakdown);
  const resumeScore = hasResumeAnalysis ? Number(resumeAnalysis.score) : null;
  const averageJobMatch = jobs.length
    ? jobs.reduce((total, job) => total + Number(job.match_percentage || 0), 0) / jobs.length
    : (profileSkills.length ? Math.min(90, Math.round(30 + profileSkills.length * 8)) : null);
  const readiness = hasResumeAnalysis
    ? Math.round(averageJobMatch === null
      ? resumeScore
      : (resumeScore + averageJobMatch) / 2)
    : null;
  const interviews = applications.filter((item) => item.status === "Interview").length;
  const hasProfileData = Boolean(profile?.skills || profile?.education || profile?.experience || profile?.university);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="sidebar-logo">
          <div className="logo-icon">🤖</div>
          <div>
            <h2>CareerAI</h2>
            <span>Placement Assistant</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <Link to="/dashboard" className="nav-item active">
            🏠
            <span>Dashboard</span>
          </Link>

          <Link to="/profile" className="nav-item">
            👤
            <span>My Profile</span>
          </Link>

          <Link to="/resume" className="nav-item">
            📄
            <span>Resume Analyzer</span>
          </Link>

          <Link to="/jobs" className="nav-item">
            💼
            <span>Job Matches</span>
          </Link>

          <Link to="/applications" className="nav-item">
            📋
            <span>Applications</span>
          </Link>

          <Link to="/interview" className="nav-item">
            🎤
            <span>AI Interview</span>
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <Link to="/profile" className="nav-item">
            ⚙️
            <span>Settings</span>
          </Link>

          <button className="logout-button" onClick={logout}>
            🚪
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Topbar */}
        <header className="dashboard-header">

          <div>
            <h1>Good morning! 👋</h1>
            <p>
              Here's your career progress and placement overview.
            </p>
          </div>

          <div className="header-profile">
            <div className="notification">🔔</div>

            <div className="avatar">
              A
            </div>

            <div>
              <strong>{user?.name || "Student"}</strong>
              <small>Job Seeker</small>
            </div>
          </div>

        </header>

        {/* Stats */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon purple">📄</div>

            <div>
              <span>Resume Score</span>
              <h2>{resumeScore === null ? "—" : `${resumeScore}%`}</h2>
              <small>
                {hasResumeAnalysis ? "From your latest analysis" : "Upload a resume to see your score"}
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">💼</div>

            <div>
              <span>Job Matches</span>
              <h2>{jobs.length}</h2>
              <small>
                {hasResumeAnalysis ? "Based on your profile" : "Based on your saved profile"}
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">📋</div>

            <div>
              <span>Applications</span>
              <h2>{applications.length}</h2>
              <small>
                {interviews} interviews
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">🎯</div>

            <div>
              <span>Readiness</span>
              <h2>{readiness === null ? "—" : `${readiness}%`}</h2>
              <small>
                {hasResumeAnalysis ? "Resume and job-fit estimate" : "Analyze a resume to see readiness"}
              </small>
            </div>
          </div>

        </section>

        {/* Main Grid */}
        <section className="dashboard-grid">

          {/* Profile Completion */}
          <div className="dashboard-card profile-card">

            <div className="card-header">
              <div>
                <h2>Profile Completion</h2>
                <p>Complete your profile to improve job matches.</p>
              </div>

              <strong>75%</strong>
            </div>

            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: "75%" }}
              ></div>
            </div>

            <div className="profile-tasks">

              <div className="task completed">
                <span>✓</span>
                Basic information
              </div>

              <div className="task completed">
                <span>✓</span>
                Education
              </div>

              <div className="task completed">
                <span>✓</span>
                Skills
              </div>

              <div className="task pending">
                <span>!</span>
                Add certifications
              </div>

            </div>

            <Link to="/profile" className="primary-link">
              Complete Profile →
            </Link>

          </div>

          {/* Recommended Jobs */}
          <div className="dashboard-card">

            <div className="card-header">
              <div>
                <h2>Recommended Jobs</h2>
                <p>Jobs matching your profile.</p>
              </div>

              <Link to="/jobs" className="view-link">
                View all
              </Link>
            </div>

            {jobs.length ? (
              <div className="job-list">
                {jobs.slice(0, 3).map((job) => (
                  <div className="job-item" key={job.job_id}>
                    <div className="company-logo">{job.company?.charAt(0) || "J"}</div>
                    <div className="job-info">
                      <h3>{job.title}</h3>
                      <p>{job.company}{job.location ? ` · ${job.location}` : ""}</p>
                    </div>
                    <div className="match-score">
                      {job.match_percentage}%
                      <small>Match</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                {hasProfileData
                  ? "No job matches are available yet. Add more skills to your profile to improve the match score."
                  : "Add your key skills to the profile to unlock personalized job matches without uploading a resume."}
              </p>
            )}

          </div>

        </section>

        {/* Bottom Grid */}
        <section className="dashboard-grid bottom-grid">

          {/* Skills */}
          <div className="dashboard-card">

            <div className="card-header">
              <div>
                <h2>Skills Overview</h2>
                <p>Your strongest skills.</p>
              </div>

              <Link to="/profile" className="view-link">
                Manage
              </Link>
            </div>

            {profileSkills.length ? (
              <div className="skill-tags">
                {profileSkills.map((skill) => (
                  <span className="skill-tag" key={skill}>{skill}</span>
                ))}
              </div>
            ) : (
              <p>Add your main technical skills to your profile to generate job matches. Upload a resume to calculate your score and readiness.</p>
            )}

          </div>

          {/* AI Recommendations */}
          <div className="dashboard-card ai-card">

            <div className="ai-icon">
              ✨
            </div>

            <h2>AI Career Recommendation</h2>

            <p>
              {profileSkills.length
                ? <>Your profile highlights <strong>{profileSkills.slice(0, 3).join(", ")}</strong>. Explore roles that match these strengths.</>
                : "Add your technical skills and profile details to unlock personalized recommendations without uploading a resume."}
            </p>

            <Link to="/jobs" className="ai-button">
              Explore Opportunities →
            </Link>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;