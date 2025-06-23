import React, { useState, useEffect } from "react";

export default function CommesseTable() {
  const [commesse, setCommesse] = useState([]);
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const fetchCommesse = async () => {
    const res = await fetch("/api/commesse");
    const data = await res.json();
    setCommesse(data);
  };

  useEffect(() => {
    fetchCommesse();
  }, []);

  const generateCustomId = () => {
    return `CM${Date.now()}`;
  };

  const handleAdd = async () => {
    if (!input.trim()) return;
    await fetch("/api/commesse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: input.trim(), id: generateCustomId() }),
    });
    setInput("");
    fetchCommesse();
  };

  const handleDelete = async (id) => {
    if (!confirm("Eliminare la commessa?")) return;
    await fetch(`/api/commesse/${id}`, { method: "DELETE" });
    fetchCommesse();
  };

  const handleEdit = (commessa) => {
    setEditId(commessa.id);
    setEditValue(commessa.nome);
  };

  const handleUpdate = async () => {
    if (!editValue.trim()) return;
    await fetch(`/api/commesse/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: editValue }),
    });
    setEditId(null);
    setEditValue("");
    fetchCommesse();
  };

  return (
    <div className="commesse-table">
      <h3>Commesse</h3>
      <div className="commesse-input-group">
        <input
          type="text"
          value={input}
          placeholder="Nuova commessa"
          onChange={(e) => setInput(e.target.value)}
          className="commesse-input"
        />
        <button onClick={handleAdd} className="commesse-button">Aggiungi</button>
      </div>

      <table className="commesse-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {commesse.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>
                {editId === c.id ? (
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="commesse-input"
                  />
                ) : (
                  c.nome
                )}
              </td>
              <td>
                {editId === c.id ? (
                  <>
                    <button onClick={handleUpdate} className="commesse-button">Salva</button>
                    <button onClick={() => setEditId(null)} className="commesse-button">Annulla</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(c)} className="commesse-button">Modifica</button>
                    <button onClick={() => handleDelete(c.id)} className="commesse-button">X</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
