import React, { useEffect, useState } from "react";
import Calendar from "./Calendar";

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    machines: "",
    workers: "",
    location: "",
    activities: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token mancante, esegui il login.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Errore:", res.status, errText);
          throw new Error(
            res.status === 401 ? "Non autorizzato." : "Errore server."
          );
        }

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Dati non validi ricevuti.");
        setJobs(data);
        console.log("Jobs:", data);
      } catch (err) {
        setError(err.message || "Errore durante il caricamento.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const getUniqueOptions = (key) => {
    const values = jobs.flatMap((job) => {
      const val = job[key];
      if (Array.isArray(val)) return val;
      if (val) return [val];
      return [];
    });

    if (typeof values[0] === "object") {
      const seen = new Set();
      return values.filter((v) => {
        const id = v._id;
        if (id && !seen.has(id)) {
          seen.add(id);
          return true;
        }
        return false;
      });
    }

    return [...new Set(values)];
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // resetta alla prima pagina se cambi filtro
  };

  const matchesFilter = (value, filterValue) => {
    if (!filterValue) return true;
    if (Array.isArray(value))
      return value.some((v) => matchesFilter(v, filterValue));
    if (typeof value === "object" && value !== null)
      return value._id === filterValue;
    return value === filterValue;
  };

  // Ordina per startDate (più recente prima)
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)
  );

  const filteredJobs = sortedJobs.filter((job) =>
    ["machines", "workers", "location", "activities"].every((key) =>
      matchesFilter(job[key], filters[key])
    )
  );

  // Paginazione
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const renderField = (field, keys = ["name", "description"]) => {
    if (!field) return "";
    if (Array.isArray(field)) {
      return field
        .map((item) =>
          typeof item === "object"
            ? keys.map((k) => item[k]).find(Boolean) || JSON.stringify(item)
            : item
        )
        .join(", ");
    }
    if (typeof field === "object") {
      return keys.map((k) => field[k]).find(Boolean) || JSON.stringify(field);
    }
    return field;
  };

  const filterLabels = {
    machines: "Macchine",
    workers: "Operai",
    location: "Luogo",
    activities: "Attività",
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard Commessa</h1>

      <div className="dashboard-filters">
        {["machines", "workers", "location", "activities"].map((key) => (
          <label key={key}>
            {filterLabels[key]}:
            <select
              name={key}
              value={filters[key]}
              onChange={handleFilterChange}
            >
              <option value="">Tutti</option>
              {getUniqueOptions(key).map((item) => {
                const val = typeof item === "object" ? item._id : item;
                const label =
                  typeof item === "object"
                    ? item.name || item.description || item._id
                    : item;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
        ))}
      </div>

      {loading && <p>Caricamento in corso...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Titolo</th>
                  <th>Operai</th>
                  <th>Macchine</th>
                  <th>Attività</th>
                  <th>Luogo</th>
                  <th>Data inizio</th>
                  <th>Data fine</th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.length > 0 ? (
                  currentJobs.map((job) => (
                    <tr key={job._id}>
                      <td>{job.title}</td>
                      <td>{renderField(job.workers)}</td>
                      <td>{renderField(job.machines)}</td>
                      <td>{renderField(job.activities)}</td>
                      <td>{renderField(job.location)}</td>
                      <td>
                        {job.startDate
                          ? new Date(job.startDate).toLocaleDateString()
                          : ""}
                      </td>
                      <td>
                        {job.endDate
                          ? new Date(job.endDate).toLocaleDateString()
                          : ""}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>Nessun dato disponibile</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Navigazione pagine */}
          {filteredJobs.length > jobsPerPage && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ← Prima
              </button>
              <span>
                Pagina {currentPage} di {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Dopo →
              </button>
            </div>
          )}

          <Calendar jobs={filteredJobs} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
