import React, { useState, useEffect } from "react";

const CreateTable = ({ commesse, onSaveRow, onDeleteRow }) => {
  const [localCommesse, setLocalCommesse] = useState([]);

  // Sincronizza stato locale con prop esterna
  useEffect(() => {
    setLocalCommesse(commesse || []);
  }, [commesse]);

  // Funzioni helper per conversione array <-> stringa
  const arrayToString = (arr) =>
    Array.isArray(arr)
      ? arr.map((item) => (typeof item === "string" ? item : item.name || "")).join(", ")
      : "";

  const stringToArray = (str) =>
    str
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

  // Modifica valori, inclusi i campi data
  const handleChange = (index, key, value) => {
    setLocalCommesse((prev) => {
      const updated = [...prev];
      if (["machines", "activities", "workers"].includes(key)) {
        updated[index] = { ...updated[index], [key]: stringToArray(value) };
      } else if (key === "startDate" || key === "endDate") {
        updated[index] = { ...updated[index], [key]: value }; // valore stringa 'YYYY-MM-DD'
      } else {
        updated[index] = { ...updated[index], [key]: value };
      }
      return updated;
    });
  };

  const handleSaveRow = async (index) => {
    if (onSaveRow) {
      await onSaveRow(localCommesse[index]);
    }
  };

  const handleDeleteRow = async (index) => {
    if (!localCommesse[index]?._id || !onDeleteRow) {
      setLocalCommesse((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    if (!window.confirm("Sei sicuro di voler cancellare questa commessa?")) return;

    try {
      await onDeleteRow(localCommesse[index]._id);
      setLocalCommesse((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      alert("Errore durante la cancellazione");
      console.error(error);
    }
  };

  return (
    <>
      <table
        border="1"
        cellPadding="6"
        cellSpacing="0"
        style={{ marginTop: "10px", width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Nome</th>
            <th>Macchine</th>
            <th>Attività</th>
            <th>Operai</th>
            <th>Località</th>
            <th>Data inizio</th>
            <th>Data fine</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {localCommesse.map((commessa, i) => (
            <tr key={commessa._id || i}>
              <td>
                <input
                  type="text"
                  value={commessa.name || ""}
                  onChange={(e) => handleChange(i, "name", e.target.value)}
                  placeholder="Nome commessa"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={arrayToString(commessa.machines)}
                  onChange={(e) => handleChange(i, "machines", e.target.value)}
                  placeholder="Macchine"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={arrayToString(commessa.activities)}
                  onChange={(e) => handleChange(i, "activities", e.target.value)}
                  placeholder="Attività"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={arrayToString(commessa.workers)}
                  onChange={(e) => handleChange(i, "workers", e.target.value)}
                  placeholder="Operai"
                />
              </td>
              <td>
                <input
                  type="date"
                  value={commessa.startDate || ""}
                  onChange={(e) => handleChange(i, "startDate", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="date"
                  value={commessa.endDate || ""}
                  onChange={(e) => handleChange(i, "endDate", e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => handleSaveRow(i)}>Salva</button>
                <button
                  onClick={() => handleDeleteRow(i)}
                  style={{ marginLeft: "8px", color: "red" }}
                >
                  Cancella
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default CreateTable;
