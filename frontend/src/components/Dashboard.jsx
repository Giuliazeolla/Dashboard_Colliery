import React, { useEffect, useState, useCallback } from "react";
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
  const [newCommessaId, setNewCommessaId] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeAttivita, setActiveAttivita] = useState(null);

  const [formData, setFormData] = useState({
    commessaId: "",
    dataInizio: "",
    dataFine: "",
    operai: "",
    mezzi: "",
  });

  // Stati per modifica commessa
  const [editingCommessaId, setEditingCommessaId] = useState(null);
  const [editingCommessaNome, setEditingCommessaNome] = useState("");
  const [editingCommessaNuovoId, setEditingCommessaNuovoId] = useState("");

  // Fetch assegnazioni dal backend
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

  const fetchCommesse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/commesse`);
      if (!res.ok) throw new Error("Errore nel caricamento commesse");
      const data = await res.json();
      setCommesse(data);
    } catch (err) {
      console.error("Errore nel caricamento commesse:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carica commesse all’avvio
  useEffect(() => {
    fetchCommesse();
  }, []);

  // Carica assegnazioni all’avvio e ogni volta che cambia activeAttivita
  useEffect(() => {
    if (activeAttivita) {
      fetchAssegnazioni();
    }
  }, [activeAttivita, fetchAssegnazioni]);

  // Funzione per eliminare commessa
  const deleteCommessa = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa commessa?"))
      return;
    try {
      const res = await fetch(`${API}/commesse/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore nell'eliminazione della commessa");
      alert("Commessa eliminata con successo");
      fetchCommesse();
    } catch (err) {
      alert("Errore: " + err.message);
    }
  };

  // Funzione per aggiornare commessa
  const updateCommessa = async () => {
    if (!editingCommessaNuovoId.trim() || !editingCommessaNome.trim()) {
      alert("ID e nome commessa non possono essere vuoti");
      return;
    }
    try {
      const res = await fetch(`${API}/commesse/${editingCommessaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCommessaNuovoId.trim(),
          nome: editingCommessaNome.trim(),
        }),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento della commessa");
      alert("Commessa aggiornata con successo");
      setEditingCommessaId(null);
      setEditingCommessaNome("");
      setEditingCommessaNuovoId("");
      fetchCommesse();
    } catch (err) {
      alert("Errore: " + err.message);
    }
  };

  // Funzione per assegnare attività a commessa
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

  const handleEliminaAssegnazione = async (id) => {
    try {
      // Chiedi conferma all’utente
      if (!window.confirm("Sei sicuro di voler eliminare questa assegnazione?"))
        return;

      // Chiamata DELETE all’API
      const response = await fetch(`/api/assegnazioni/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione");
      }

      // Aggiorna lo stato rimuovendo l’assegnazione eliminata
      setAssegnazioni((prev) => prev.filter((a) => a._id !== id));
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  const handleModificaAssegnazione = async (assegnazione) => {
    try {
      const commessaId = window.prompt(
        "Nuova commessaId:",
        assegnazione.commessaId
      );
      if (!commessaId) return;

      const attivita = window.prompt("Nuova attività:", assegnazione.attivita);
      if (!attivita) return;

      // Per gli array (operai e mezzi) puoi chiedere input separati e trasformarli in array
      const operaiStr = window.prompt(
        "Operai (separati da virgola):",
        assegnazione.operai.join(",")
      );
      const operai = operaiStr ? operaiStr.split(",").map((s) => s.trim()) : [];

      const mezziStr = window.prompt(
        "Mezzi (separati da virgola):",
        assegnazione.mezzi.join(",")
      );
      const mezzi = mezziStr ? mezziStr.split(",").map((s) => s.trim()) : [];

      const dataInizio = window.prompt(
        "Nuova data inizio (YYYY-MM-DD):",
        assegnazione.dataInizio
      );
      if (!dataInizio) return;

      const dataFine = window.prompt(
        "Nuova data fine (YYYY-MM-DD):",
        assegnazione.dataFine
      );
      if (!dataFine) return;

      const updated = {
        commessaId,
        attivita,
        dataInizio,
        dataFine,
        operai,
        mezzi,
      };

      const response = await fetch(`/api/assegnazioni/${assegnazione._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento");
      }

      const data = await response.json();

      setAssegnazioni((prev) =>
        prev.map((a) => (a._id === assegnazione._id ? data : a))
      );
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  // Funzione per ottenere nome commessa da ID
  const getNomeCommessa = (id) => {
    const commessa = commesse.find((c) => c.id === id || c._id === id);
    return commessa ? commessa.nome : "Commessa non trovata";
  };

  // Apri pannello di assegnazione per attività
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

  // Chiudi pannello assegnazione
  const closePanel = () => {
    setActiveAttivita(null);
  };

  // Gestisci submit form
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

  // Filtra assegnazioni valide (legate a commesse esistenti)
  const commesseIds = commesse.map((c) => c.id);
  const assegnazioniValide = assegnazioni.filter((a) =>
    commesseIds.includes(a.commessaId)
  );

  // Filtra assegnazioni per attività attiva e commesse esistenti
  const assegnazioniPerAttivita = activeAttivita
    ? assegnazioniValide.filter((a) => a.attivita === activeAttivita)
    : [];

  function formatDateIT(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return (
    <div className="dashboard-container" style={{ position: "relative" }}>
      <h2 className="dashboard-title">Dashboard Commesse & Attività</h2>

      {/* Sezione Commesse */}
      <section className="commesse-section">
        <h3 className="section__title">Commesse</h3>

        <div className="commesse-input-group">
          <input
            className="commesse-input"
            type="text"
            placeholder="ID nuova commessa"
            value={newCommessaId}
            onChange={(e) => setNewCommessaId(e.target.value)}
            aria-label="ID nuova commessa"
          />
          <input
            className="commesse-input"
            type="text"
            placeholder="Nome nuova commessa"
            value={newCommessa}
            onChange={(e) => setNewCommessa(e.target.value)}
            aria-label="Nome nuova commessa"
          />
          <button
            className="commesse-button"
            onClick={async () => {
              if (!newCommessaId.trim() || !newCommessa.trim()) {
                alert("ID e nome sono obbligatori");
                return;
              }
              const nuova = {
                id: newCommessaId.trim(),
                nome: newCommessa.trim(),
              };
              try {
                const res = await fetch("/api/commesse", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(nuova),
                });
                if (!res.ok) throw new Error("Errore nella creazione");
                alert("Commessa creata con successo");
                setNewCommessa("");
                setNewCommessaId("");
                fetchCommesse();
              } catch (err) {
                alert("Errore: " + err.message);
              }
            }}
          >
            Aggiungi
          </button>
        </div>

        {loading ? (
          <p>Caricamento commesse...</p>
        ) : (
          <table className="commesse-table" role="grid">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {commesse
                .filter((commessa) => commessa && commessa.id && commessa.nome)
                .map((commessa) => (
                  <tr key={commessa.id}>
                    <td>
                      {editingCommessaId === commessa.id ? (
                        <input
                          type="text"
                          value={editingCommessaNuovoId}
                          onChange={(e) =>
                            setEditingCommessaNuovoId(e.target.value)
                          }
                          aria-label="Modifica ID commessa"
                        />
                      ) : (
                        commessa.id
                      )}
                    </td>
                    <td>
                      {editingCommessaId === commessa.id ? (
                        <input
                          type="text"
                          value={editingCommessaNome}
                          onChange={(e) =>
                            setEditingCommessaNome(e.target.value)
                          }
                          aria-label="Modifica nome commessa"
                        />
                      ) : (
                        commessa.nome
                      )}
                    </td>
                    <td>
                      {editingCommessaId === commessa.id ? (
                        <>
                          <button
                            className="btn btn-save"
                            onClick={updateCommessa}
                            aria-label="Salva modifica commessa"
                          >
                            Salva
                          </button>
                          <button
                            className="btn btn-cancel"
                            onClick={() => {
                              setEditingCommessaId(null);
                              setEditingCommessaNome("");
                              setEditingCommessaNuovoId("");
                            }}
                            aria-label="Annulla modifica commessa"
                          >
                            Annulla
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="actions">
                            <button
                              className="btn btn-edit"
                              onClick={() => {
                                setEditingCommessaId(commessa.id);
                                setEditingCommessaNome(commessa.nome);
                                setEditingCommessaNuovoId(commessa.id);
                              }}
                              aria-label="Modifica commessa"
                            >
                              Modifica
                            </button>
                            <button
                              className="btn btn-delete"
                              onClick={() => deleteCommessa(commessa.id)}
                              aria-label="Elimina commessa"
                            >
                              Elimina
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Sezione attività */}
      <section className="attivita-section">
        <h3 className="section__title">Attività</h3>
        <div className="attivita-buttons">
          {attivitàStatiche.map((attivita) => (
            <button
              key={attivita}
              className="attivita-button"
              onClick={() => openPanel(attivita)}
              aria-pressed={activeAttivita === attivita}
            >
              {attivita}
            </button>
          ))}
        </div>

        {/* Pannello assegnazione attività */}
        {activeAttivita && (
          <div
            className="assegnazione-panel"
            aria-live="polite"
            aria-label={`Assegna attività: ${activeAttivita}`}
          >
            <h4>Assegna attività: {activeAttivita}</h4>
            <form onSubmit={handleSubmit} className="form-assegnazione">
              <label htmlFor="commessaIdInput">ID Commessa:</label>
              <input
                id="commessaIdInput"
                type="text"
                value={formData.commessaId}
                onChange={(e) =>
                  setFormData({ ...formData, commessaId: e.target.value })
                }
                placeholder="Inserisci ID commessa"
                aria-required="true"
              />

              <label htmlFor="operaiInput">Operai (separati da virgola):</label>
              <input
                id="operaiInput"
                type="text"
                value={formData.operai}
                onChange={(e) =>
                  setFormData({ ...formData, operai: e.target.value })
                }
                placeholder="es. Mario Rossi, Luigi Bianchi"
              />

              <label htmlFor="mezziInput">Mezzi (separati da virgola):</label>
              <input
                id="mezziInput"
                type="text"
                value={formData.mezzi}
                onChange={(e) =>
                  setFormData({ ...formData, mezzi: e.target.value })
                }
                placeholder="es. Escavatore, Betoniere"
              />

              <div className="form-row">
                <div>
                  <label htmlFor="dataInizioInput">Data Inizio:</label>
                  <input
                    id="dataInizioInput"
                    type="date"
                    value={formData.dataInizio}
                    onChange={(e) =>
                      setFormData({ ...formData, dataInizio: e.target.value })
                    }
                    aria-required="true"
                  />
                  {/* Visualizzo la data in formato italiano sotto l'input */}
                  {formData.dataInizio && (
                    <p>
                      Data Inizio (formato IT):{" "}
                      {formatDateIT(formData.dataInizio)}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="dataFineInput">Data Fine:</label>
                  <input
                    id="dataFineInput"
                    type="date"
                    value={formData.dataFine}
                    onChange={(e) =>
                      setFormData({ ...formData, dataFine: e.target.value })
                    }
                    aria-required="true"
                  />
                  {/* Visualizzo la data in formato italiano sotto l'input */}
                  {formData.dataFine && (
                    <p>
                      Data Fine (formato IT): {formatDateIT(formData.dataFine)}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-save"
                  aria-label="Assegna attività"
                >
                  Assegna
                </button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={closePanel}
                  aria-label="Chiudi pannello assegnazione"
                >
                  Annulla
                </button>
              </div>
            </form>

            {/* Visualizza assegnazioni per questa attività */}
            <h5>Assegnazioni esistenti</h5>
            {assegnazioniPerAttivita.length === 0 && (
              <p>Nessuna assegnazione per questa attività.</p>
            )}
            {assegnazioniPerAttivita.length > 0 && (
              <table className="assegnazioni-table" role="grid">
                <thead>
                  <tr>
                    <th>Commessa ID</th>
                    <th>Nome Commessa</th>
                    <th>Data Inizio</th>
                    <th>Data Fine</th>
                    <th>Operai</th>
                    <th>Mezzi</th>
                    <th>Azioni</th> {/* Colonna per i bottoni */}
                  </tr>
                </thead>
                <tbody>
                  {assegnazioniPerAttivita.map((a) => (
                    <tr key={a._id}>
                      <td>{a.commessaId}</td>
                      <td>{getNomeCommessa(a.commessaId)}</td>
                      <td>{a.operai.join(", ")}</td>
                      <td>{a.mezzi.join(", ")}</td>
                      {/* Usa formatDateIT per visualizzare la data in formato italiano */}
                      <td>{formatDateIT(a.dataInizio)}</td>
                      <td>{formatDateIT(a.dataFine)}</td>
                      <td>
                        <div className="new">
                          <button
                            className="btn btn-edit"
                            onClick={() => handleModificaAssegnazione(a)}
                          >
                            Modifica
                          </button>
                          <button
                            className="btn btn-delete"
                            onClick={() => handleEliminaAssegnazione(a._id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* Calendario opzionale */}
      <Calendar attività={assegnazioni} />
    </div>
  );
}
