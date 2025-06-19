import React, { useEffect, useState, useCallback } from "react";
import Calendar from "./Calendar";
import CreateTable from "./CreateTable";

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
        if (!nomiCommesse.includes(value)) setNomiCommesse([...nomiCommesse, value]);
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

  const renderTable = (title, data, type, selectedSet) => (
    <div>
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Seleziona</th>
            <th>#</th>
            <th>Valore</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedSet.has(item)}
                  onChange={() => toggleSelection(type, item)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{item}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <input
          type="text"
          value={newItem[type] || ""}
          onChange={(e) => setNewItem({ ...newItem, [type]: e.target.value })}
          placeholder={`Aggiungi ${title.toLowerCase()}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddToTable(type);
            }
          }}
        />
        <button onClick={() => handleAddToTable(type)} type="button">
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <h1>Dashboard Commesse</h1>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          {renderTable("Nomi Commesse", nomiCommesse, "nomeCommessa", selectedNomi)}
        </div>
        <div className="dashboard-card">
          {renderTable("Operai", operai, "operaio", selectedOperai)}
        </div>
        <div className="dashboard-card">
          {renderTable("Attività", attivita, "attivita", selectedAttivita)}
        </div>
        <div className="dashboard-card">
          {renderTable("Mezzi", mezzi, "mezzo", selectedMezzi)}
        </div>
      </div>

      <button onClick={handleSaveCommessa} className="save-button">
        Salva Commessa
      </button>

      <div className="commesse-list">
        <h2>Elenco Commesse salvate</h2>
        {loading ? (
          <p>Caricamento...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Operai</th>
                <th>Attività</th>
                <th>Mezzi</th>
                <th>Data inizio</th>
                <th>Data fine</th>
              </tr>
            </thead>
            <tbody>
              {commesse.map((commessa) => (
                <tr key={commessa._id}>
                  <td>{commessa._id}</td>
                  <td>{commessa.name}</td>
                  <td>{commessa.workers?.join(", ")}</td>
                  <td>{commessa.activities?.join(", ")}</td>
                  <td>{commessa.machines?.join(", ")}</td>
                  <td>{new Date(commessa.startDate).toLocaleDateString()}</td>
                  <td>{new Date(commessa.endDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <Calendar />
        <CreateTable />
      </div>
    </div>
  );
};

export default Dashboard;
