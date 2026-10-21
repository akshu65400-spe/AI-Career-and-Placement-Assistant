import React, { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Applications() {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [applications, setApplications] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    shortlisted: 0,
    interviews: 0,
    selected: 0,
    rejected: 0,
  });

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company: "",
    position: "",
    status: "Applied",
    applied_date: "",
  });

  // ==============================
  // LOAD APPLICATIONS
  // ==============================

  const loadApplications = async () => {
    if (!user) return;

    try {
      const response = await api.get(
        `/applications/${user.id}`
      );

      setApplications(response.data);
    } catch (error) {
      console.error(
        "Error loading applications:",
        error
      );
    }
  };

  // ==============================
  // LOAD STATISTICS
  // ==============================

  const loadStats = async () => {
    if (!user) return;

    try {
      const response = await api.get(
        `/applications/stats/${user.id}`
      );

      setStats(response.data);
    } catch (error) {
      console.error(
        "Error loading statistics:",
        error
      );
    }
  };

  // ==============================
  // LOAD EVERYTHING
  // ==============================

  const loadData = async () => {
    setLoading(true);

    await Promise.all([
      loadApplications(),
      loadStats(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // ==============================
  // FORM CHANGE
  // ==============================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==============================
  // SAVE APPLICATION
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.company.trim()) {
      alert("Please enter company name.");
      return;
    }

    if (!form.position.trim()) {
      alert("Please enter job position.");
      return;
    }

    if (!form.applied_date) {
      alert("Please select application date.");
      return;
    }

    setSaving(true);

    try {
      await api.post(
        `/applications/${user.id}`,
        form
      );

      alert(
        "Application saved successfully!"
      );

      setForm({
        company: "",
        position: "",
        status: "Applied",
        applied_date: "",
      });

      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Failed to save application."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // DELETE APPLICATION
  // ==============================

  const deleteApplication = async (
    applicationId
  ) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(
        `/applications/${applicationId}`
      );

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete application."
      );
    }
  };

  // ==============================
  // STATUS CLASS
  // ==============================

  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <Navbar title="Applications" />

        {/* PAGE HEADER */}

        <section className="page-heading">

          <div>

            <span className="page-badge">
              CAREER TRACKER
            </span>

            <h2>
              Applications
            </h2>

            <p>
              Keep track of your job applications
              and placement progress in one place.
            </p>

          </div>

          <div className="heading-icon">
            📋
          </div>

        </section>

        {/* STATISTICS */}

        <div className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon purple">
              📋
            </div>

            <div>
              <span>
                TOTAL APPLICATIONS
              </span>

              <h2>
                {stats.total}
              </h2>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon blue">
              📤
            </div>

            <div>
              <span>
                APPLIED
              </span>

              <h2>
                {stats.applied}
              </h2>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon green">
              🎯
            </div>

            <div>
              <span>
                SHORTLISTED
              </span>

              <h2>
                {stats.shortlisted}
              </h2>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon orange">
              🎤
            </div>

            <div>
              <span>
                INTERVIEWS
              </span>

              <h2>
                {stats.interviews}
              </h2>
            </div>

          </div>

        </div>

        {/* APPLICATION TRACKER */}

        <section className="content-card">

          <div className="card-header">

            <div>

              <h3>
                Application Tracker
              </h3>

              <p>
                Track all your job applications
                and their current status.
              </p>

            </div>

            <button
              className="primary-btn"
              onClick={() =>
                setShowForm(!showForm)
              }
            >
              {showForm
                ? "✕ Close"
                : "+ Add Application"}
            </button>

          </div>

          {/* ADD APPLICATION FORM */}

          {showForm && (

            <form
              className="application-form"
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Company
                  </label>

                  <input
                    name="company"
                    placeholder="Company name"
                    value={form.company}
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label>
                    Position
                  </label>

                  <input
                    name="position"
                    placeholder="Job position"
                    value={form.position}
                    onChange={handleChange}
                  />

                </div>

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >

                    <option value="Applied">
                      Applied
                    </option>

                    <option value="Shortlisted">
                      Shortlisted
                    </option>

                    <option value="Interview">
                      Interview
                    </option>

                    <option value="Selected">
                      Selected
                    </option>

                    <option value="Rejected">
                      Rejected
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Applied Date
                  </label>

                  <input
                    type="date"
                    name="applied_date"
                    value={form.applied_date}
                    onChange={handleChange}
                  />

                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Application"}
                </button>

              </div>

            </form>

          )}

          {/* APPLICATION LIST */}

          <div className="applications-list">

            {loading ? (

              <div className="empty-state">

                <p>
                  Loading applications...
                </p>

              </div>

            ) : applications.length === 0 ? (

              <div className="empty-state">

                <div>
                  📋
                </div>

                <h3>
                  No applications yet
                </h3>

                <p>
                  Click "Add Application" to
                  start tracking your applications.
                </p>

              </div>

            ) : (

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      <th>
                        Company
                      </th>

                      <th>
                        Position
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Applied Date
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {applications.map(
                      (application) => (

                        <tr
                          key={
                            application.id
                          }
                        >

                          <td>
                            <strong>
                              {
                                application.company
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              application.position
                            }
                          </td>

                          <td>

                            <span
                              className={
                                `status ${getStatusClass(
                                  application.status
                                )}`
                              }
                            >
                              {
                                application.status
                              }
                            </span>

                          </td>

                          <td>
                            {
                              application.applied_date
                            }
                          </td>

                          <td>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                deleteApplication(
                                  application.id
                                )
                              }
                            >
                              🗑️
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Applications;