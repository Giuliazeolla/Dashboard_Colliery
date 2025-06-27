import React, { useEffect, useState, useCallback } from "react";
import MultiSelect from "./MultiSelect";
import Gantt from "./gantt";

import {
  STATIC_WORKERS,
  STATIC_MACHINES,
  STATIC_ATTREZZI,
  STATIC_ATTIVITA,
} from "../../../backend/staticsData";

const API = "http://localhost:5000/api";

export default function Dashboard() {
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [workers] = useState(STATIC_WORKERS);
  const [machines] = useState(STATIC_MACHINES);
  const [attrezzi] = useState(STATIC_ATTREZZI);
  const [newCommessaData, setNewCommessaData] = useState({
    id: "",
    nome: "",
    localita: "",
    coordinate: "",
    numeroPali: "",
    numeroStrutture: "",
    numeroModuli: "",
  });

  const [loading, setLoading] = useState(true);

  const [activeAttivita, setActiveAttivita] = useState(null);

  const [formData, setFormData] = useState({
    nome: "",
    dataInizio: "",
    dataFine: "",
    operai: [],
    mezzi: [],
    attrezzi: [],
  });

  // Stati per modifica commessa
  const [editingCommessaId, setEditingCommessaId] = useState(null);
  const [editingCommessaNome, setEditingCommessaNome] = useState("");
  const [editingCommessaNuovoId, setEditingCommessaNuovoId] = useState("");
  const [editingCommessaLocalita, setEditingCommessaLocalita] = useState("");
  const [editingCommessaCoordinate, setEditingCommessaCoordinate] =
    useState("");
  const [editingCommessaNumeroPali, setEditingCommessaNumeroPali] =
    useState("");
  const [editingCommessaNumeroStrutture, setEditingCommessaNumeroStrutture] =
    useState("");
  const [editingCommessaNumeroModuli, setEditingCommessaNumeroModuli] =
    useState("");

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
  const deleteCommessa = async (idCommessa) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa commessa?"))
      return;

    try {
      // Elimina la commessa
      const resCommessa = await fetch(`${API}/commesse/${idCommessa}`, {
        method: "DELETE",
      });

      if (!resCommessa.ok)
        throw new Error("Errore nell'eliminazione della commessa");

      // Elimina tutte le assegnazioni collegate alla commessa
      const resAssegnazioni = await fetch(
        `${API}/assegnazioni/commessa/${idCommessa}`,
        {
          method: "DELETE",
        }
      );

      if (!resAssegnazioni.ok)
        throw new Error("Errore nell'eliminazione delle assegnazioni");

      // Aggiorna lo stato frontend
      setAssegnazioni((prev) =>
        prev.filter((a) => a.commessaId !== idCommessa)
      );

      alert("Commessa e assegnazioni eliminate con successo");

      // Ricarica le commesse aggiornate
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
          localita: editingCommessaLocalita.trim(),
          coordinate: editingCommessaCoordinate.trim(),
          numeroPali: Number(editingCommessaNumeroPali),
          numeroStrutture: Number(editingCommessaNumeroStrutture),
          numeroModuli: Number(editingCommessaNumeroModuli),
        }),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento della commessa");
      alert("Commessa aggiornata con successo");
      setEditingCommessaId(null);
      setEditingCommessaNome("");
      setEditingCommessaNuovoId("");
      setEditingCommessaLocalita("");
      setEditingCommessaCoordinate("");
      setEditingCommessaNumeroPali("");
      setEditingCommessaNumeroStrutture("");
      setEditingCommessaNumeroModuli("");
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
    selectedMachines,
    selectedAttrezzi
  ) => {
    if (!commessaId) return alert("Seleziona una commessa");
    if (!dataInizio || !dataFine) return alert("Inserisci date valide");
    if (new Date(dataFine) < new Date(dataInizio))
      return alert(
        "La data di fine deve essere uguale o successiva a quella di inizio"
      );
    if (
      selectedWorkers.length === 0 &&
      selectedMachines.length === 0 &&
      selectedAttrezzi.length === 0
    )
      return alert("Inserisci almeno un operaio o un mezzo");

    const payload = {
      attivita,
      commessaId,
      dataInizio,
      dataFine,
      operai: selectedWorkers,
      mezzi: selectedMachines,
      attrezzi: selectedAttrezzi,
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
      const response = await fetch(`api/assegnazioni/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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

      const attrezziStr = window.prompt(
        "Attrezzi (separati da virgola):",
        assegnazione.attrezzi.join(",")
      );
      const attrezzi = attrezziStr
        ? attrezziStr.split(",").map((s) => s.trim())
        : [];

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
        dataInizio,
        dataFine,
        operai,
        mezzi,
        attrezzi,
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
      operai: [],
      mezzi: [],
      attrezzi: [],
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
      .map((w) => w.trim())
      .filter((w) => w !== "");
    const selectedMachines = formData.mezzi
      .map((m) => m.trim())
      .filter((m) => m !== "");
    const selectedAttrezzi = formData.attrezzi
      .map((a) => a.trim())
      .filter((a) => a !== "");

    const ok = await assignToActivity(
      activeAttivita,
      formData.commessaId,
      formData.dataInizio,
      formData.dataFine,
      selectedWorkers,
      selectedMachines,
      selectedAttrezzi
    );

    if (ok) {
      setFormData({
        commessaId: "",
        dataInizio: "",
        dataFine: "",
        operai: [],
        mezzi: [],
        attrezzi: [],
      });
      closePanel();
    }
  };

  // Filtra assegnazioni valide (legate a commesse esistenti)
  const commesseIds = commesse.map((c) => c._id);
  const assegnazioniValide = assegnazioni.filter((a) =>
    commesseIds.includes(a.commessaId)
  );

  // Filtra assegnazioni per attività attiva e commesse esistenti
  const assegnazioniPerAttivita = activeAttivita
    ? assegnazioniValide.filter(
        (a) =>
          a.attivita &&
          a.attivita.toLowerCase() === activeAttivita.toLowerCase()
      )
    : [];

  function formatDateIT(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  console.log("activeAttivita:", activeAttivita);
  console.log("assegnazioni:", assegnazioni);
  console.log("assegnazioniValide:", assegnazioniValide);
  console.log("assegnazioniPerAttivita:", assegnazioniPerAttivita);

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
            value={newCommessaData.id}
            onChange={(e) =>
              setNewCommessaData({ ...newCommessaData, id: e.target.value })
            }
            aria-label="ID"
          />
          <input
            className="commesse-input"
            type="text"
            placeholder="Nome"
            value={newCommessaData.nome}
            onChange={(e) =>
              setNewCommessaData({ ...newCommessaData, nome: e.target.value })
            }
            aria-label="Nome nuova commessa"
          />
          <input
            className="commesse-input"
            type="text"
            placeholder="Località"
            value={newCommessaData.localita}
            onChange={(e) =>
              setNewCommessaData({
                ...newCommessaData,
                localita: e.target.value,
              })
            }
            aria-label="Località"
          />
          <input
            className="commesse-input"
            type="text"
            placeholder="Coordinate"
            value={newCommessaData.coordinate}
            onChange={(e) =>
              setNewCommessaData({
                ...newCommessaData,
                coordinate: e.target.value,
              })
            }
            aria-label="Coordinate"
          />
          <input
            className="commesse-input"
            type="number"
            placeholder="Numero Pali"
            value={newCommessaData.numeroPali}
            onChange={(e) =>
              setNewCommessaData({
                ...newCommessaData,
                numeroPali: e.target.value,
              })
            }
            aria-label="Numero Pali"
          />
          <input
            className="commesse-input"
            type="number"
            placeholder="Numero Strutture"
            value={newCommessaData.numeroStrutture}
            onChange={(e) =>
              setNewCommessaData({
                ...newCommessaData,
                numeroStrutture: e.target.value,
              })
            }
            aria-label="Numero Strutture"
          />
          <input
            className="commesse-input"
            type="number"
            placeholder="Numero Moduli"
            value={newCommessaData.numeroModuli}
            onChange={(e) =>
              setNewCommessaData({
                ...newCommessaData,
                numeroModuli: e.target.value,
              })
            }
            aria-label="Numero Moduli"
          />
          <button
            className="commesse-button"
            onClick={async () => {
              if (!newCommessaData.id.trim() || !newCommessaData.nome.trim()) {
                alert("ID e nome sono obbligatori");
                return;
              }
              const nuova = {
                id: newCommessaData.id.trim(),
                nome: newCommessaData.nome.trim(),
                localita: newCommessaData.localita.trim(),
                coordinate: newCommessaData.coordinate.trim(),
                numeroPali: Number(newCommessaData.numeroPali),
                numeroStrutture: Number(newCommessaData.numeroStrutture),
                numeroModuli: Number(newCommessaData.numeroModuli),
              };
              try {
                const res = await fetch("/api/commesse", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(nuova),
                });
                if (!res.ok) throw new Error("Errore nella creazione");
                alert("Commessa creata con successo");
                setNewCommessaData({
                  id: "",
                  nome: "",
                  localita: "",
                  coordinate: "",
                  numeroPali: "",
                  numeroStrutture: "",
                  numeroModuli: "",
                });
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
                <th>Località</th>
                <th>Coordinate</th>
                <th>Numero Pali</th>
                <th>Numero Strutture</th>
                <th>Numero Moduli</th>
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
                        <input
                          type="text"
                          value={editingCommessaLocalita}
                          onChange={(e) =>
                            setEditingCommessaLocalita(e.target.value)
                          }
                          aria-label="Modifica località commessa"
                        />
                      ) : (
                        commessa.localita
                      )}
                    </td>
                    <td>
                      {editingCommessaId === commessa.id ? (
                        <input
                          type="text"
                          value={editingCommessaCoordinate}
                          onChange={(e) =>
                            setEditingCommessaCoordinate(e.target.value)
                          }
                          aria-label="Modifica coordinate commessa"
                        />
                      ) : (
                        commessa.coordinate
                      )}
                    </td>
                    <td>
                      {editingCommessaId === commessa.id ? (
                        <input
                          type="text"
                          value={editingCommessaNumeroPali}
                          onChange={(e) =>
                            setEditingCommessaNumeroPali(e.target.value)
                          }
                          aria-label="Modifica numero pali commessa"
                        />
                      ) : (
                        commessa.numeroPali
                      )}
                    </td>
                    <td>
                      {editingCommessaId === commessa.id ? (
                        <input
                          type="text"
                          value={editingCommessaNumeroStrutture}
                          onChange={(e) =>
                            setEditingCommessaNumeroStrutture(e.target.value)
                          }
                          aria-label="Modifica numero strutture commessa"
                        />
                      ) : (
                        commessa.numeroStrutture
                      )}
                    </td>
                    <td>
                      {editingCommessaId === commessa.id ? (
                        <input
                          type="text"
                          value={editingCommessaNumeroModuli}
                          onChange={(e) =>
                            setEditingCommessaNumeroModuli(e.target.value)
                          }
                          aria-label="Modifica numero moduli commessa"
                        />
                      ) : (
                        commessa.numeroModuli
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
                              setEditingCommessaLocalita("");
                              setEditingCommessaCoordinate("");
                              setEditingCommessaNumeroPali(0);
                              setEditingCommessaNumeroStrutture(0);
                              setEditingCommessaNumeroModuli(0);
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
                                setEditingCommessaLocalita(commessa.localita);
                                setEditingCommessaCoordinate(
                                  commessa.coordinate
                                );
                                setEditingCommessaNumeroPali(
                                  commessa.numeroPali
                                );
                                setEditingCommessaNumeroStrutture(
                                  commessa.numeroStrutture
                                );
                                setEditingCommessaNumeroModuli(
                                  commessa.numeroModuli
                                );
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
          {STATIC_ATTIVITA.map((attivita) => (
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
              {/* COMMESSA */}
              <label htmlFor="commessaSelect">Commessa:</label>
              <select
                id="commessaSelect"
                value={formData.commessaId}
                onChange={(e) =>
                  setFormData({ ...formData, commessaId: e.target.value })
                }
                aria-required="true"
              >
                <option value="">Seleziona una commessa</option>
                {commesse.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              {/* OPERAI */}
              <MultiSelect
                label="Operai"
                id="operaiSelect"
                options={workers}
                selectedValues={formData.operai}
                toggleValue={(val) => {
                  setFormData((prev) => {
                    const selected = prev.operai;
                    if (selected.includes(val)) {
                      return {
                        ...prev,
                        operai: selected.filter((v) => v !== val),
                      };
                    } else {
                      return { ...prev, operai: [...selected, val] };
                    }
                  });
                }}
              />

              {/* MEZZI */}
              <MultiSelect
                label="Mezzi"
                id="mezziSelect"
                options={machines}
                selectedValues={formData.mezzi}
                toggleValue={(val) => {
                  setFormData((prev) => {
                    const selected = prev.mezzi;
                    if (selected.includes(val)) {
                      return {
                        ...prev,
                        mezzi: selected.filter((v) => v !== val),
                      };
                    } else {
                      return { ...prev, mezzi: [...selected, val] };
                    }
                  });
                }}
              />

              {/* ATTREZZI */}
              <MultiSelect
                label="Attrezzi"
                id="attrezziSelect"
                options={attrezzi}
                selectedValues={formData.attrezzi}
                toggleValue={(val) => {
                  setFormData((prev) => {
                    const selected = prev.attrezzi;
                    if (selected.includes(val)) {
                      return {
                        ...prev,
                        attrezzi: selected.filter((v) => v !== val),
                      };
                    } else {
                      return { ...prev, attrezzi: [...selected, val] };
                    }
                  });
                }}
              />

              {/* DATE */}
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
                  {formData.dataFine && (
                    <p>
                      Data Fine (formato IT): {formatDateIT(formData.dataFine)}
                    </p>
                  )}
                </div>
              </div>

              {/* AZIONI */}
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
                    <th>Attrezzi</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {assegnazioniPerAttivita.map((a) => (
                    <tr key={a._id}>
                      <td>
                        {commesse.find((c) => c._id === a.commessaId)?.id ||
                          "ID non trovato"}
                      </td>
                      <td>{getNomeCommessa(a.commessaId)}</td>
                      <td>{formatDateIT(a.dataInizio)}</td>
                      <td>{formatDateIT(a.dataFine)}</td>
                      <td>{a.operai.join(", ")}</td>
                      <td>{a.mezzi.join(", ")}</td>
                      <td>{a.attrezzi.join(", ")}</td>
                      <td>
                        <div className="new">
                          <button
                            className="btn btn-edit"
                            onClick={() => handleModificaAssegnazione(a._id)}
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
      <Gantt />
    </div>
  );
}
