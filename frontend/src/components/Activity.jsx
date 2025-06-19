import React, { useState } from "react";

const TabellaAttivita = ({ attivita, setAttivita }) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      setAttivita([...attivita, input.trim()]);
      setInput("");
    }
  };

  const handleDelete = (index) => {
    setAttivita(attivita.filter((_, i) => i !== index));
  };

  return (
    <div className="lista-container">
      <h3>Attività</h3>
      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aggiungi attività"
        />
        <button onClick={handleAdd}>Aggiungi</button>
      </div>
      <ul className="lista-items">
        {attivita.map((att, index) => (
          <li key={index} >
            <span>{att}</span>
            <button onClick={() => handleDelete(index)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabellaAttivita;
