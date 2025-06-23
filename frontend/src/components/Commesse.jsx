import React, { useEffect, useState } from "react";
import axios from "axios";

const TabellaCommesse = () => {
  const [commesse, setCommesse] = useState([]);
  const [input, setInput] = useState("");

  // Carica commesse all'avvio
  useEffect(() => {
    fetchCommesse();
  }, []);

  const fetchCommesse = async () => {
    try {
      const res = await axios.get("/api/commesse");
      setCommesse(res.data);
    } catch (err) {
      console.error("Errore nel caricamento commesse:", err);
    }
  };

  const handleAdd = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      const res = await axios.post("/api/commesse", { nome: trimmed });
      setCommesse((prev) => [...prev, res.data]);
      setInput("");
    } catch (err) {
      console.error("Errore nell'aggiunta della commessa:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/commesse/${id}`);
      setCommesse((prev) => prev.filter((commessa) => commessa._id !== id));
    } catch (err) {
      console.error("Errore nella cancellazione:", err);
    }
  };

  return (
    <div className="lista-container">
      <h3>Elenco Commesse</h3>
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
        {commesse.map((commessa) => (
          <li key={commessa._id}>
            <span>{commessa.nome}</span>
            <button onClick={() => handleDelete(commessa._id)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabellaCommesse;
