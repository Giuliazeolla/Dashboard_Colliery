import React, { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Calendar from "./Calendar";

const API = "http://localhost:5000/api";

const attivitàStatiche = [
  "Progettazione Esecutiva",
  "Pull-out Test",
  "Disegni Esecutivi",
  "Ordine Fornitore",
  "Consegna Pali",
  "Infissione Pali",
  "Consegna Struttura",
  "Montaggio Struttura",
  "Montaggio Moduli",
  "Collaudo",
];

export default function Dashboard() {
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [newCommessa, setNewCommessa] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeAttivita, setActiveAttivita] = useState(null);

  const [formData, setFormData] = useState({
    commessaId: "",
    dataInizio: "",
    dataFine: "",
    operai: "",
    mezzi: "",
  });

  const fetchAssegnazioni = useCallback(async () => {
    try {
      const res = await fetch(`${API}/assegnazioni`);
      if (!res.ok) throw new Error("Errore nel caricamento assegnazioni");
      const data = await res.json();
      setAssegnazioni(data);
    } catch (error) {
      alert(error.message);
    }
  }, []);

  useEffect(() => {
    fetchAssegnazioni();
  }, [fetchAssegnazioni]);

  const fetchCommesse = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/commesse");
      const data = await res.json();
      setCommesse(data);
    } catch (err) {
      console.error("Errore nel caricamento commesse:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommesse();
  }, []);

  const assignToActivity = async (
    attivita,
    commessaId,
    dataInizio,
    dataFine,
    selectedWorkers,
    selectedMachines
  ) => {
    if (!commessaId) return alert("Seleziona una commessa");
    if (!dataInizio || !dataFine) return alert("Inserisci date valide");
    if (new Date(dataFine) < new Date(dataInizio))
      return alert(
        "La data di fine deve essere uguale o successiva a quella di inizio"
      );
    if (selectedWorkers.length === 0 && selectedMachines.length === 0)
      return alert("Inserisci almeno un operaio o un mezzo");

    const payload = {
      attivita,
      commessaId,
      dataInizio,
      dataFine,
      operai: selectedWorkers,
      mezzi: selectedMachines,
    };

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/assegnazioni`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Errore durante l'assegnazione";
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch {
          // ignora
        }
        throw new Error(errorMsg);
      }
      alert("Assegnazione effettuata con successo");
      fetchAssegnazioni();
      return true;
    } catch (error) {
      alert("Errore: " + error.message);
      return false;
    }
  };

  const getNomeCommessa = (id) => {
    const commessa = commesse.find((c) => c.id === id);
    return commessa ? commessa.nome : "Commessa non trovata";
  };

  const openPanel = (attivita) => {
    setActiveAttivita(attivita);
    setFormData({
      commessaId: "",
      dataInizio: "",
      dataFine: "",
      operai: "",
      mezzi: "",
    });
  };

  const closePanel = () => {
    setActiveAttivita(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedWorkers = formData.operai
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w !== "");
    const selectedMachines = formData.mezzi
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m !== "");

    const ok = await assignToActivity(
      activeAttivita,
      formData.commessaId,
      formData.dataInizio,
      formData.dataFine,
      selectedWorkers,
      selectedMachines
    );

    if (ok) {
      setFormData({
        commessaId: "",
        dataInizio: "",
        dataFine: "",
        operai: "",
        mezzi: "",
      });
      closePanel();
    }
  };

  const assegnazioniPerAttivita = activeAttivita
    ? assegnazioni.filter((a) => a.attivita === activeAttivita)
    : [];

  return (
    <div className="dashboard" style={{ position: "relative" }}>
      <h2 className="dashboard__title">Dashboard Commesse & Attività</h2>

{/* Sezione Commesse */}
<section className="commesse-section">
  <h3 className="section__title">Commesse</h3>

  <div className="commesse-input-group">
    <input
      className="commesse-input"
      type="text"
      placeholder="Nuova commessa"
      value={newCommessa}
      onChange={(e) => setNewCommessa(e.target.value)}
    />
    <button
      className="commesse-button"
      onClick={async () => {
        if (!newCommessa.trim()) return;
        const nuova = {
          id: uuidv4(),
          nome: newCommessa.trim(),
        };
        try {
          await fetch("/api/commesse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuova),
          });
          setNewCommessa("");
          fetchCommesse();
        } catch (err) {
          console.error("Errore nel salvataggio:", err);
        }
      }}
    >
      Aggiungi
    </button>
  </div>

  {loading ? (
    <p className="loading-text">Caricamento...</p>
  ) : (
    <table className="commesse-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
        </tr>
      </thead>
      <tbody>
        {commesse.length === 0 && (
          <tr>
            <td colSpan="2" style={{ textAlign: "center", color: "#888" }}>
              Nessuna commessa presente. Aggiungi una nuova commessa.
            </td>
          </tr>
        )}
        {commesse.map((c) => (
          <tr key={c.id}>
            <td>{c.id}</td>
            <td>{c.nome}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</section>

{/* Sezione Attività (struttura ad albero cliccabile) */}
<section className="assegnazioni-section" style={{ marginTop: "2rem" }}>
  <h3 className="section__title">Assegnazioni attività (clicca per modificare)</h3>

  <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
    {attivitàStatiche.map((att, idx) => (
      <li
        key={idx}
        style={{
          padding: "0.5rem 1rem",
          borderBottom: "1px solid #ddd",
          cursor: "pointer",
          backgroundColor: activeAttivita === att ? "#f0f8ff" : "transparent",
          userSelect: "none",
        }}
        onClick={() => (activeAttivita === att ? closePanel() : openPanel(att))}
        aria-expanded={activeAttivita === att}
        aria-controls={`panel-${idx}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            activeAttivita === att ? closePanel() : openPanel(att);
          }
        }}
      >
        <strong>{att}</strong>
      </li>
    ))}
  </ul>
</section>

{/* Pannello laterale con form di modifica assegnazioni */}
{activeAttivita && (
  <div
    className="sidepanel-overlay"
    onClick={(e) => {
      if (e.target.classList.contains("sidepanel-overlay")) closePanel();
    }}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.3)",
      zIndex: 1000,
    }}
    aria-modal="true"
    role="dialog"
    aria-labelledby="sidepanel-title"
  >
    <aside
      className="sidepanel"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "400px",
        height: "100%",
        backgroundColor: "#fff",
        padding: "1rem",
        boxShadow: "-4px 0 8px rgba(0,0,0,0.2)",
        overflowY: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 id="sidepanel-title" style={{ margin: 0 }}>
          Assegna a: <em>{activeAttivita}</em>
        </h3>
        <button
          onClick={closePanel}
          aria-label="Chiudi pannello"
          style={{
            fontSize: "1.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="commessaSelect">Commessa</label>
          <select
            id="commessaSelect"
            value={formData.commessaId}
            onChange={(e) =>
              setFormData((f) => ({ ...f, commessaId: e.target.value }))
            }
            required
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          >
            <option value="">-- Seleziona commessa --</option>
            {commesse.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="dataInizio">Data Inizio</label>
          <input
            id="dataInizio"
            type="date"
            value={formData.dataInizio}
            onChange={(e) =>
              setFormData((f) => ({ ...f, dataInizio: e.target.value }))
            }
            required
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="dataFine">Data Fine</label>
          <input
            id="dataFine"
            type="date"
            value={formData.dataFine}
            onChange={(e) =>
              setFormData((f) => ({ ...f, dataFine: e.target.value }))
            }
            required
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="operai">Operai (separati da virgola)</label>
          <input
            id="operai"
            type="text"
            placeholder="Es. Mario Rossi, Luca Bianchi"
            value={formData.operai}
            onChange={(e) =>
              setFormData((f) => ({ ...f, operai: e.target.value }))
            }
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="mezzi">Mezzi (separati da virgola)</label>
          <input
            id="mezzi"
            type="text"
            placeholder="Es. Escavatore, Gru"
            value={formData.mezzi}
            onChange={(e) =>
              setFormData((f) => ({ ...f, mezzi: e.target.value }))
            }
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1.1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Conferma Assegnazione
        </button>
      </form>

      <hr style={{ margin: "1.5rem 0" }} />

      <section>
        <h4>Assegnazioni esistenti per {activeAttivita}</h4>
        {assegnazioniPerAttivita.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "#666" }}>
            Nessuna assegnazione per questa attività
          </p>
        ) : (
          <ul
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              paddingLeft: 0,
              listStyleType: "none",
              margin: 0,
            }}
          >
            {assegnazioniPerAttivita.map((a) => (
              <li
                key={a._id}
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <strong>Commessa:</strong> {getNomeCommessa(a.commessaId)} <br />
                <strong>Periodo:</strong> {a.dataInizio} → {a.dataFine} <br />
                <strong>Operai:</strong>{" "}
                {a.operai && a.operai.length > 0 ? a.operai.join(", ") : "-"} <br />
                <strong>Mezzi:</strong>{" "}
                {a.mezzi && a.mezzi.length > 0 ? a.mezzi.join(", ") : "-"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  </div>

      )}

      <Calendar />
    </div>
  );
}
