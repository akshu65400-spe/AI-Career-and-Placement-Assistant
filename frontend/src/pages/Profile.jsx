import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const resumeResultKey = `resumeAnalysis:${user?.id ?? "guest"}`;
  let resumeAnalysis = null;
  try {
    resumeAnalysis = JSON.parse(localStorage.getItem(resumeResultKey) || "null");
  } catch {
    resumeAnalysis = null;
  }

  const [profile, setProfile] = useState({
    name: user?.name || "Student",
    email: user?.email || "student@example.com",
    phone: "",
    location: "",
    degree: "B.Tech",
    university: "",
    graduation: "2027",
    branch: "Computer Science",
    skills: "",
    github: "",
    linkedin: "",
    bio: "",
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobMatches, setJobMatches] = useState(null);

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

  const profileSkillList = parseSkills(profile.skills || resumeAnalysis?.skills);
  const hasResumeAnalysis = Number.isFinite(Number(resumeAnalysis?.score))
    && Boolean(resumeAnalysis?.score_breakdown);
  const resumeScore = hasResumeAnalysis ? Number(resumeAnalysis.score) : null;

  const averageJobMatch = jobMatches?.length
    ? jobMatches.reduce((total, job) => total + Number(job.match_percentage || 0), 0) / jobMatches.length
    : (profileSkillList.length ? Math.min(90, Math.round(30 + profileSkillList.length * 8)) : null);
  const readiness = hasResumeAnalysis
    ? Math.round(averageJobMatch === null
      ? resumeScore
      : (resumeScore + averageJobMatch) / 2)
    : null;

  useEffect(() => {
    if (!user?.id) return;

    api.get(`/profile/${user.id}`)
      .then((response) => {
        const data = response.data;
        setProfile((prev) => ({
          ...prev,
          name: user?.name || prev.name,
          email: user?.email || prev.email,
          phone: data.phone || "",
          location: data.location || "",
          degree: data.education || prev.degree,
          university: data.university || "",
          graduation: String(data.graduation_year || prev.graduation),
          branch: data.branch || prev.branch,
          skills: data.skills || prev.skills || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          bio: data.experience || "",
        }));
      })
      .catch(() => {
        // ignore if profile not created yet
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setJobMatches(null);
      return;
    }

    api.get(`/jobs/match/${user.id}`)
      .then((response) => setJobMatches(response.data || []))
      .catch(() => setJobMatches([]));
  }, [user?.id, profile.skills, resumeAnalysis?.score]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });

    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);

    try {
      await api.post(`/profile/${user.id}`, {
        phone: profile.phone,
        education: profile.degree,
        university: profile.university,
        branch: profile.branch,
        graduation_year: Number(profile.graduation),
        skills: profile.skills,
        experience: profile.bio,
      });

      localStorage.setItem("profile", JSON.stringify(profile));
      setSaved(true);
    } catch (error) {
      console.error(error);
      setSaved(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <div className="profile-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            AI
          </div>

          <div>
            <h2>CareerAI</h2>
            <span>Placement Assistant</span>
          </div>

        </div>

        <nav>

          <Link to="/dashboard">
            <span>📊</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/profile" className="active">
            <span>👤</span>
            <span>My Profile</span>
          </Link>

          <Link to="/resume">
            <span>📄</span>
            <span>Resume AI</span>
          </Link>

          <Link to="/jobs">
            <span>💼</span>
            <span>Jobs</span>
          </Link>

          <Link to="/applications">
            <span>📋</span>
            <span>Applications</span>
          </Link>

          <Link to="/interview">
            <span>🤖</span>
            <span>AI Interview</span>
          </Link>

        </nav>

        <button
          className="logout-button"
          onClick={logout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="profile-content">

        {/* HEADER */}

        <div className="page-header">

          <div>

            <span className="page-badge">
              PROFILE
            </span>

            <h1>
              My Profile
            </h1>

            <p>
              Complete your profile to improve your AI-powered
              job recommendations and placement opportunities.
            </p>

          </div>

          <div className="header-icon">
            👤
          </div>

        </div>

        {/* ================= TOP CARDS ================= */}

        <div className="profile-stats">

          <div className="profile-stat-card">

            <div className="profile-stat-icon">
              👤
            </div>

            <div>
              <span>Profile Completion</span>
              <strong>75%</strong>
            </div>

          </div>

          <div className="profile-stat-card">

            <div className="profile-stat-icon">
              📄
            </div>

            <div>
              <span>Resume Score</span>
              <strong>{resumeScore === null ? "—" : `${resumeScore}%`}</strong>
            </div>

          </div>

          <div className="profile-stat-card">

            <div className="profile-stat-icon">
              💼
            </div>

            <div>
              <span>Job Matches</span>
              <strong>{jobMatches?.length ?? 0}</strong>
            </div>

          </div>

          <div className="profile-stat-card">

            <div className="profile-stat-icon">
              🎯
            </div>

            <div>
              <span>Readiness</span>
              <strong>{readiness === null ? "—" : `${readiness}%`}</strong>
            </div>

          </div>

        </div>

        {/* ================= PROFILE GRID ================= */}

        <div className="profile-layout">

          {/* FORM */}

          <div className="profile-card">

            <div className="profile-card-header">

              <div>
                <h2>Personal Information</h2>

                <p>
                  Keep your information updated for better job matching.
                </p>
              </div>

              <div className="profile-avatar">
                {profile.name.charAt(0).toUpperCase()}
              </div>

            </div>

            <form onSubmit={handleSave}>

              <div className="profile-form-grid">

                <div className="profile-input-group">

                  <label>Full Name</label>

                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                  />

                </div>

                <div className="profile-input-group">

                  <label>Email Address</label>

                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />

                </div>

                <div className="profile-input-group">

                  <label>Phone Number</label>

                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                  />

                </div>

                <div className="profile-input-group">

                  <label>Skills</label>

                  <input
                    name="skills"
                    value={profile.skills}
                    onChange={handleChange}
                    placeholder="Python, React, SQL, FastAPI"
                  />

                </div>

                <div className="profile-input-group">

                  <label>Location</label>

                  <input
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    placeholder="City, State"
                  />

                </div>

              </div>

              {/* EDUCATION */}

              <div className="profile-section">

                <div className="section-title">
                  🎓 Education
                </div>

                <div className="profile-form-grid">

                  <div className="profile-input-group">

                    <label>Degree</label>

                    <select
                      name="degree"
                      value={profile.degree}
                      onChange={handleChange}
                    >
                      <option>B.Tech</option>
                      <option>BCA</option>
                      <option>MCA</option>
                      <option>B.Sc</option>
                      <option>M.Tech</option>
                      <option>MBA</option>
                      <option>Other</option>
                    </select>

                  </div>

                  <div className="profile-input-group">

                    <label>Branch / Specialization</label>

                    <input
                      name="branch"
                      value={profile.branch}
                      onChange={handleChange}
                      placeholder="Computer Science"
                    />

                  </div>

                  <div className="profile-input-group">

                    <label>University</label>

                    <input
                      name="university"
                      value={profile.university}
                      onChange={handleChange}
                      placeholder="University name"
                    />

                  </div>

                  <div className="profile-input-group">

                    <label>Graduation Year</label>

                    <select
                      name="graduation"
                      value={profile.graduation}
                      onChange={handleChange}
                    >
                      <option>2026</option>
                      <option>2027</option>
                      <option>2028</option>
                      <option>2029</option>
                      <option>2030</option>
                    </select>

                  </div>

                </div>

              </div>

              {/* LINKS */}

              <div className="profile-section">

                <div className="section-title">
                  🔗 Professional Links
                </div>

                <div className="profile-form-grid">

                  <div className="profile-input-group">

                    <label>GitHub</label>

                    <input
                      name="github"
                      value={profile.github}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                    />

                  </div>

                  <div className="profile-input-group">

                    <label>LinkedIn</label>

                    <input
                      name="linkedin"
                      value={profile.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                    />

                  </div>

                </div>

              </div>

              {/* BIO */}

              <div className="profile-section">

                <div className="profile-input-group">

                  <label>About You</label>

                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder="Tell recruiters about your skills, interests and career goals..."
                    rows="5"
                  />

                </div>

              </div>

              <div className="profile-actions">

                {saved && (
                  <span className="save-success">
                    ✓ Profile saved successfully
                  </span>
                )}

                <button
                  type="submit"
                  className="save-profile-button"
                >
                  Save Profile
                </button>

              </div>

            </form>

          </div>

          {/* RIGHT SIDE */}

          <div>

            {/* COMPLETION */}

            <div className="profile-card completion-card">

              <h2>
                Profile Completion
              </h2>

              <p>
                Complete your profile to get better job matches.
              </p>

              <div className="profile-progress-circle">

                <div>
                  <strong>75%</strong>
                  <span>Complete</span>
                </div>

              </div>

              <div className="completion-list">

                <div className="completion-row done">
                  <span>✓</span>
                  Basic Information
                </div>

                <div className="completion-row done">
                  <span>✓</span>
                  Education
                </div>

                <div className="completion-row done">
                  <span>✓</span>
                  Skills
                </div>

                <div className="completion-row pending">
                  <span>!</span>
                  Certifications
                </div>

                <div className="completion-row pending">
                  <span>!</span>
                  Projects
                </div>

              </div>

            </div>

            {/* AI INSIGHT */}

            <div className="ai-recommendation profile-ai">

              <div className="recommendation-icon">
                ✨
              </div>

              <div className="recommendation-content">

                <h2>
                  AI Profile Insight
                </h2>

                <p>
                  Adding certifications and projects can improve
                  your profile visibility and increase your job
                  match score.
                </p>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Profile;