import React, { useState } from "react";

const TabellaOperai = ({ operai, setOperai }) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      setOperai([...operai, input.trim()]);
      setInput("");
    }
  };

  const handleDelete = (index) => {
    setOperai(operai.filter((_, i) => i !== index));
  };

  return (
    <div className="lista-container">
      <h3>Operai</h3>
      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aggiungi operaio"
        />
        <button onClick={handleAdd}>Aggiungi</button>
      </div>
      <ul className="lista-items">
        {operai.map((operaio, index) => (
          <li key={index} >
            <span>{operaio}</span>
            <button onClick={() => handleDelete(index)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabellaOperai;
