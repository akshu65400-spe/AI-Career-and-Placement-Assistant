import React from "react";
import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Jobs() {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!user) return;

    api.get(`/jobs/match/${user.id}`)
      .then((response) => {
        setJobs(response.data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [user?.id]);

  const filteredJobs = jobs.filter((job) => {

    const text =
      `${job.title} ${job.company}`
        .toLowerCase();

    return text.includes(
      search.toLowerCase()
    );

  });

  return (

    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <Navbar title="Find Jobs" />

        <section className="jobs-header">

          <div>

            <h2>
              Jobs matched to your skills
            </h2>

            <p>
              AI-powered recommendations based on skills detected in your latest resume.
            </p>

          </div>

          <input
            className="search-input"
            placeholder="🔍 Search jobs..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </section>

        {loading ? (

          <div className="content-card empty-state">
            Loading jobs...
          </div>

        ) : filteredJobs.length === 0 ? (

          <div className="content-card empty-state">

            <div>🔎</div>

            <h3>No matching jobs</h3>

            <p>
              Upload and analyze a resume with skills relevant to available roles, or try another search.
            </p>

          </div>

        ) : (

          <div className="jobs-grid">

            {filteredJobs.map((job) => (

              <div
                className="job-card"
                key={job.job_id}
              >

                <div className="job-card-top">

                  <div className="company-logo large">
                    {job.company?.charAt(0)}
                  </div>

                  <div className="match-badge">
                    {job.match_percentage}%
                    Match
                  </div>

                </div>

                <h3>{job.title}</h3>

                <p className="company-name">
                  {job.company}
                </p>

                <div className="job-location">
                  📍 {job.location || "Remote / India"}
                </div>

                <div className="skills-section">

                  <strong>
                    Missing Skills
                  </strong>

                  <div className="skill-tags">

                    {job.missing_skills?.length
                      ? job.missing_skills.map(
                          (skill) => (
                            <span
                              className="skill-tag missing"
                              key={skill}
                            >
                              {skill}
                            </span>
                          )
                        )
                      : (
                        <span className="skill-tag">
                          All required skills
                        </span>
                      )}

                  </div>

                </div>

                <div className="job-card-bottom">

                  <span>
                    AI Match Score
                  </span>

                  <strong>
                    {job.match_percentage}%
                  </strong>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

export default Jobs;