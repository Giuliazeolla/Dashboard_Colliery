// components/TabellaNomiCommesse.js
import React, { useState } from "react";

const TabellaNomiCommesse = ({ nomiCommesse, setNomiCommesse }) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      setNomiCommesse([...nomiCommesse, input.trim()]);
      setInput("");
    }
  };

  const handleDelete = (index) => {
    setNomiCommesse(nomiCommesse.filter((_, i) => i !== index));
  };

  return (
    <div className="lista-container">
      <h3>Nomi Commesse</h3>
      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aggiungi nome commessa"
        />
        <button onClick={handleAdd}>Aggiungi</button>
      </div>
      <ul className="lista-items">
        {(nomiCommesse || []).map((nome, index) => (
          <li key={index}>
            <span>{nome}</span>
            <button onClick={() => handleDelete(index)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabellaNomiCommesse;
