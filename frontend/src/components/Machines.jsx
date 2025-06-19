import React, { useState } from "react";

const TabellaMezzi = ({ mezzi, setMezzi }) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      setMezzi([...mezzi, input.trim()]);
      setInput("");
    }
  };

  const handleDelete = (index) => {
    setMezzi(mezzi.filter((_, i) => i !== index));
  };

  return (
    <div className="lista-container">
      <h3>Mezzi e Attrezzature</h3>
      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aggiungi mezzo/attrezzatura"
        />
        <button onClick={handleAdd}>Aggiungi</button>
      </div>
      <ul className="lista-items">
        {mezzi.map((mezzo, index) => (
          <li key={index}>
            <span>{mezzo}</span>
            <button onClick={() => handleDelete(index)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabellaMezzi;
