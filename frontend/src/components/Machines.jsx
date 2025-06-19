import React, { useState } from "react";

const TabellaMezzi = ({ mezzi, setMezzi }) => {
  const [input, setInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      setMezzi([...mezzi, input.trim()]);
      setInput("");
    }
  };

  const handleDelete = (index) => {
    setMezzi(mezzi.filter((_, i) => i !== index));
  };

  const handleEditClick = (index) => {
    setEditingIndex(index);
    setEditValue(mezzi[index]);
  };

  const handleSaveClick = (index) => {
    if (editValue.trim()) {
      const updatedMezzi = [...mezzi];
      updatedMezzi[index] = editValue.trim();
      setMezzi(updatedMezzi);
      setEditingIndex(null);
      setEditValue("");
    }
  };

  return (
    <div className="dashboard-card">
      <div>
        <h3>Mezzi</h3>
        <table>
          <thead>
            <tr>
              <th>Seleziona</th>
              <th>ID</th>
              <th>Valore</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {mezzi.map((mezzo, index) => (
              <tr key={index}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>{index + 1}</td>
                <td>
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                  ) : (
                    mezzo
                  )}
                </td>
                <td>
                  {editingIndex === index ? (
                    <button onClick={() => handleSaveClick(index)}>Aggiorna</button>
                  ) : (
                    <button onClick={() => handleEditClick(index)}>Modifica</button>
                  )}
                  <button
                    onClick={() => handleDelete(index)}
                    style={{ marginLeft: "8px" }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "10px" }}>
          <input
            placeholder="Aggiungi mezzi"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="button" onClick={handleAdd}>
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabellaMezzi;
