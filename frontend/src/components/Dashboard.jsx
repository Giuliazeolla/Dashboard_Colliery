import React, { useEffect, useState, useCallback } from "react";
import Calendar from "./Calendar";


const Dashboard = () => {
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nomiCommesse, setNomiCommesse] = useState(["Quaregna", "Tauria Nova"]);
  const [operai, setOperai] = useState(["Emanuele Sasso", "Diego Barricelli"]);
  const [attivita, setAttivita] = useState(["Pull-out test", "Installazione"]);
  const [mezzi, setMezzi] = useState(["Bobcat", "Battipalo"]);

  const [newItem, setNewItem] = useState({
    nomeCommessa: "",
    operaio: "",
    attivita: "",
    mezzo: "",
  });

  // Stati per i selezionati (Set)
  const [selectedNomi, setSelectedNomi] = useState(new Set());
  const [selectedOperai, setSelectedOperai] = useState(new Set());
  const [selectedAttivita, setSelectedAttivita] = useState(new Set());
  const [selectedMezzi, setSelectedMezzi] = useState(new Set());

  // Stato per gestione modifica commessa
  const [editingCommessaId, setEditingCommessaId] = useState(null);
  const [editingData, setEditingData] = useState({
    name: "",
    workers: [],
    activities: [],
    machines: [],
    startDate: "",
    endDate: "",
  });

  const fetchCommesse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/commesse", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error(`Errore: ${res.status} - ${res.statusText}`);

      const data = await res.json();
      setCommesse(data);
    } catch (err) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommesse();
  }, [fetchCommesse]);

  const handleAddToTable = (type) => {
    const value = newItem[type]?.trim();
    if (!value) return;

    // Aggiungi solo se non già presente (evita duplicati)
    switch (type) {
      case "nomeCommessa":
        if (!nomiCommesse.includes(value))
          setNomiCommesse([...nomiCommesse, value]);
        break;
      case "operaio":
        if (!operai.includes(value)) setOperai([...operai, value]);
        break;
      case "attivita":
        if (!attivita.includes(value)) setAttivita([...attivita, value]);
        break;
      case "mezzo":
        if (!mezzi.includes(value)) setMezzi([...mezzi, value]);
        break;
      default:
        break;
    }
    setNewItem({ ...newItem, [type]: "" });
  };

  const toggleSelection = (type, item) => {
    const toggleSet = (prevSet) => {
      const newSet = new Set(prevSet);
      if (newSet.has(item)) newSet.delete(item);
      else newSet.add(item);
      return newSet;
    };

    switch (type) {
      case "nomeCommessa":
        setSelectedNomi(toggleSet);
        break;
      case "operaio":
        setSelectedOperai(toggleSet);
        break;
      case "attivita":
        setSelectedAttivita(toggleSet);
        break;
      case "mezzo":
        setSelectedMezzi(toggleSet);
        break;
      default:
        break;
    }
  };

  const handleSaveCommessa = async () => {
    if (selectedNomi.size === 0) {
      alert("Seleziona almeno un nome commessa.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Utente non autenticato. Effettua il login.");
      return;
    }

    const nuovaCommessa = {
      name: Array.from(selectedNomi).join(", "),
      workers: Array.from(selectedOperai),
      activities: Array.from(selectedAttivita),
      machines: Array.from(selectedMezzi),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      // Il backend assegna createdBy in base al token
    };

    try {
      const res = await fetch("http://localhost:5000/api/commesse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nuovaCommessa),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Errore: ${res.status} - ${errorText}`);
      }

      await res.json();
      alert("Commessa salvata con successo!");
      fetchCommesse();

      // Resetta selezioni
      setSelectedNomi(new Set());
      setSelectedOperai(new Set());
      setSelectedAttivita(new Set());
      setSelectedMezzi(new Set());
    } catch (error) {
      alert("Errore durante il salvataggio della commessa.");
      console.error("Errore fetch:", error);
    }
  };

  // Nuove funzioni per modifica ed eliminazione commessa

  const startEditing = (commessa) => {
    setEditingCommessaId(commessa._id);
    setEditingData({
      name: commessa.name || "",
      workers: commessa.workers || [],
      activities: commessa.activities || [],
      machines: commessa.machines || [],
      startDate: commessa.startDate ? commessa.startDate.substring(0, 10) : "",
      endDate: commessa.endDate ? commessa.endDate.substring(0, 10) : "",
    });
  };

  const cancelEditing = () => {
    setEditingCommessaId(null);
    setEditingData({
      name: "",
      workers: [],
      activities: [],
      machines: [],
      startDate: "",
      endDate: "",
    });
  };

  const handleEditingChange = (field, value) => {
    setEditingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateCommessa = async () => {
    if (!editingCommessaId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Utente non autenticato. Effettua il login.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/commesse/${editingCommessaId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editingData.name,
            workers: editingData.workers,
            activities: editingData.activities,
            machines: editingData.machines,
            startDate: editingData.startDate,
            endDate: editingData.endDate,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Errore: ${res.status} - ${errorText}`);
      }

      await res.json();
      alert("Commessa aggiornata con successo!");
      fetchCommesse();
      cancelEditing();
    } catch (error) {
      alert("Errore durante l'aggiornamento della commessa.");
      console.error("Errore fetch:", error);
    }
  };

  const handleDeleteCommessa = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa commessa?"))
      return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Utente non autenticato. Effettua il login.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/commesse/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Errore: ${res.status} - ${errorText}`);
      }

      alert("Commessa eliminata con successo!");
      fetchCommesse();
    } catch (error) {
      alert("Errore durante l'eliminazione della commessa.");
      console.error("Errore fetch:", error);
    }
  };

  // Aggiunta di elimina e modifica anche alle tabelle semplici (nomi, operai, attività, mezzi)
  const handleDeleteItem = (type, item) => {
    switch (type) {
      case "nomeCommessa":
        setNomiCommesse(nomiCommesse.filter((i) => i !== item));
        setSelectedNomi((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item);
          return newSet;
        });
        break;
      case "operaio":
        setOperai(operai.filter((i) => i !== item));
        setSelectedOperai((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item);
          return newSet;
        });
        break;
      case "attivita":
        setAttivita(attivita.filter((i) => i !== item));
        setSelectedAttivita((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item);
          return newSet;
        });
        break;
      case "mezzo":
        setMezzi(mezzi.filter((i) => i !== item));
        setSelectedMezzi((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item);
          return newSet;
        });
        break;
      default:
        break;
    }
  };

  const handleEditItem = (type, item) => {
    const newValue = prompt(`Modifica valore ${type}:`, item);
    if (newValue && newValue.trim() !== "") {
      switch (type) {
        case "nomeCommessa":
          setNomiCommesse(
            nomiCommesse.map((i) => (i === item ? newValue.trim() : i))
          );
          break;
        case "operaio":
          setOperai(operai.map((i) => (i === item ? newValue.trim() : i)));
          break;
        case "attivita":
          setAttivita(attivita.map((i) => (i === item ? newValue.trim() : i)));
          break;
        case "mezzo":
          setMezzi(mezzi.map((i) => (i === item ? newValue.trim() : i)));
          break;
        default:
          break;
      }
    }
  };

  // Funzione per generare tabella con button Modifica e Elimina
  const renderTable = (items, type) => (
    <table
      style={{
        borderCollapse: "collapse",
        width: "100%",
        marginBottom: "1rem",
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f0f0f0" }}>
          <th style={{ border: "1px solid #ccc", padding: "6px" }}>{type}</th>
          <th style={{ border: "1px solid #ccc", padding: "6px" }}>
            Selezionato
          </th>
          <th style={{ border: "1px solid #ccc", padding: "6px" }}>Modifica</th>
          <th style={{ border: "1px solid #ccc", padding: "6px" }}>Elimina</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => {
          const isSelected =
            type === "nomeCommessa"
              ? selectedNomi.has(item)
              : type === "operaio"
              ? selectedOperai.has(item)
              : type === "attivita"
              ? selectedAttivita.has(item)
              : type === "mezzo"
              ? selectedMezzi.has(item)
              : false;
          return (
            <tr key={idx}>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                {item}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(type, item)}
                />
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                <button onClick={() => handleEditItem(type, item)}>
                  Modifica
                </button>
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                <button onClick={() => handleDeleteItem(type, item)}>
                  Elimina
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-header">Dashboard Commesse</h2>
      <div className="tables-row">
        <section className="section">
          <h3>Gestione Nomi Commesse</h3>
          {renderTable(nomiCommesse, "nomeCommessa")}
          <input
            type="text"
            placeholder="Nuovo nome commessa"
            value={newItem.nomeCommessa}
            onChange={(e) =>
              setNewItem({ ...newItem, nomeCommessa: e.target.value })
            }
            className="input-text"
          />
          <button
            className="button"
            onClick={() => handleAddToTable("nomeCommessa")}
          >
            Aggiungi
          </button>
        </section>

        <section className="section">
          <h3>Gestione Operai</h3>
          {renderTable(operai, "operaio")}
          <input
            type="text"
            placeholder="Nuovo operaio"
            value={newItem.operaio}
            onChange={(e) =>
              setNewItem({ ...newItem, operaio: e.target.value })
            }
            className="input-text"
          />
          <button
            className="button"
            onClick={() => handleAddToTable("operaio")}
          >
            Aggiungi
          </button>
        </section>

        <section className="section">
          <h3>Gestione Attività</h3>
          {renderTable(attivita, "attivita")}
          <input
            type="text"
            placeholder="Nuova attività"
            value={newItem.attivita}
            onChange={(e) =>
              setNewItem({ ...newItem, attivita: e.target.value })
            }
            className="input-text"
          />
          <button
            className="button"
            onClick={() => handleAddToTable("attivita")}
          >
            Aggiungi
          </button>
        </section>

        <section className="section">
          <h3>Gestione Mezzi</h3>
          {renderTable(mezzi, "mezzo")}
          <input
            type="text"
            placeholder="Nuovo mezzo"
            value={newItem.mezzo}
            onChange={(e) => setNewItem({ ...newItem, mezzo: e.target.value })}
            className="input-text"
          />
          <button className="button" onClick={() => handleAddToTable("mezzo")}>
            Aggiungi
          </button>
        </section>
      </div>

      <button
        className="button"
        style={{ marginTop: "20px", fontSize: "16px" }}
        onClick={handleSaveCommessa}
      >
        Salva nuova commessa
      </button>

      <hr style={{ margin: "30px 0" }} />
      <div className="section-commesse">
        <section className="section"> 
          <h3>Commesse salvate</h3>
          {loading ? (
            <p>Caricamento...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : commesse.length === 0 ? (
            <p>Nessuna commessa salvata.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table-commesse">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Operai</th>
                    <th>Attività</th>
                    <th>Mezzi</th>
                    <th>Data inizio</th>
                    <th>Data fine</th>
                    <th>Modifica</th>
                    <th>Elimina</th>
                  </tr>
                </thead>
                <tbody>
                  {commesse.map((commessa) => (
                    <tr key={commessa._id}>
                      <td>
                        {editingCommessaId === commessa._id ? (
                          <input
                            type="text"
                            value={editingData.name}
                            onChange={(e) =>
                              handleEditingChange("name", e.target.value)
                            }
                            className="input-text"
                          />
                        ) : (
                          commessa.name
                        )}
                      </td>
                      <td>
                        {editingCommessaId === commessa._id ? (
                          <input
                            type="text"
                            value={editingData.workers.join(", ")}
                            onChange={(e) =>
                              handleEditingChange(
                                "workers",
                                e.target.value.split(",").map((w) => w.trim())
                              )
                            }
                            className="input-text"
                          />
                        ) : (
                          commessa.workers?.join(", ")
                        )}
                      </td>
                      <td>
                        {editingCommessaId === commessa._id ? (
                          <input
                            type="text"
                            value={editingData.activities.join(", ")}
                            onChange={(e) =>
                              handleEditingChange(
                                "activities",
                                e.target.value.split(",").map((a) => a.trim())
                              )
                            }
                            className="input-text"
                          />
                        ) : (
                          commessa.activities?.join(", ")
                        )}
                      </td>
                      <td>
                        {editingCommessaId === commessa._id ? (
                          <input
                            type="text"
                            value={editingData.machines.join(", ")}
                            onChange={(e) =>
                              handleEditingChange(
                                "machines",
                                e.target.value.split(",").map((m) => m.trim())
                              )
                            }
                            className="input-text"
                          />
                        ) : (
                          commessa.machines?.join(", ")
                        )}
                      </td>
                      <td>
                        {editingCommessaId === commessa._id ? (
                          <input
                            type="date"
                            value={editingData.startDate}
                            onChange={(e) =>
                              handleEditingChange("startDate", e.target.value)
                            }
                            className="input-text"
                          />
                        ) : (
                          commessa.startDate?.substring(0, 10)
                        )}
                      </td>
                      <td>
                        {editingCommessaId === commessa._id ? (
                          <input
                            type="date"
                            value={editingData.endDate}
                            onChange={(e) =>
                              handleEditingChange("endDate", e.target.value)
                            }
                            className="input-text"
                          />
                        ) : (
                          commessa.endDate?.substring(0, 10)
                        )}
                      </td>
                      <td className="center">
                        {editingCommessaId === commessa._id ? (
                          <div className="editing-buttons">
                            <button
                              className="button save-button"
                              onClick={handleUpdateCommessa}
                            >
                              Salva
                            </button>
                            <button
                              className="button cancel-button"
                              onClick={cancelEditing}
                            >
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button
                            className="button"
                            onClick={() => startEditing(commessa)}
                          >
                            Modifica
                          </button>
                        )}
                      </td>
                      <td className="center">
                        <button
                          className="button danger"
                          onClick={() => handleDeleteCommessa(commessa._id)}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <hr style={{ margin: "30px 0" }} />

        <section className="section">
          <h3>Calendario</h3>
          <Calendar />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
