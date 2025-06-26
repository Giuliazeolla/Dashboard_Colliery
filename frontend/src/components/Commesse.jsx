import React, { useState, useEffect } from "react";

export default function CommesseTable() {
  const [commesse, setCommesse] = useState([]);
  const [input, setInput] = useState("");
  const [localita, setLocalita] = useState("");
  const [coordinate, setCoordinate] = useState("");
  const [numeroPali, setNumeroPali] = useState(0);
  const [numeroStrutture, setNumeroStrutture] = useState(0);
  const [numeroModuli, setNumeroModuli] = useState(0);

  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editLocalita, setEditLocalita] = useState("");
  const [editCoordinate, setEditCoordinate] = useState("");
  const [editNumeroPali, setEditNumeroPali] = useState(0);
  const [editNumeroStrutture, setEditNumeroStrutture] = useState(0);
  const [editNumeroModuli, setEditNumeroModuli] = useState(0);

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
      body: JSON.stringify({
        nome: input.trim(),
        id: generateCustomId(),
        localita,
        coordinate,
        numeroPali: Number(numeroPali),
        numeroStrutture: Number(numeroStrutture),
        numeroModuli: Number(numeroModuli),
      }),
    });

    setInput("");
    setLocalita("");
    setCoordinate("");
    setNumeroPali(0);
    setNumeroStrutture(0);
    setNumeroModuli(0);

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
    setEditLocalita(commessa.localita);
    setEditCoordinate(commessa.coordinate);
    setEditNumeroPali(commessa.numeroPali ?? 0);
    setEditNumeroStrutture(commessa.numeroStrutture ?? 0);
    setEditNumeroModuli(commessa.numeroModuli ?? 0);
  };

  const handleUpdate = async () => {
    if (!editValue.trim()) return;

    await fetch(`/api/commesse/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: editValue,
        localita: editLocalita,
        coordinate: editCoordinate,
        numeroPali: Number(editNumeroPali),
        numeroStrutture: Number(editNumeroStrutture),
        numeroModuli: Number(editNumeroModuli),
      }),
    });

    setEditId(null);
    setEditValue("");
    setEditLocalita("");
    setEditCoordinate("");
    setEditNumeroPali(0);
    setEditNumeroStrutture(0);
    setEditNumeroModuli(0);

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
        <input
          type="text"
          value={localita}
          placeholder="Località"
          onChange={(e) => setLocalita(e.target.value)}
          className="commesse-input"
        />
        <input
          type="text"
          value={coordinate}
          placeholder="Coordinate"
          onChange={(e) => setCoordinate(e.target.value)}
          className="commesse-input"
        />
        <input
          type="number"
          min="0"
          value={numeroPali}
          placeholder="Numero Pali"
          onChange={(e) => setNumeroPali(e.target.value === "" ? 0 : Number(e.target.value))}
          className="commesse-input"
        />
        <input
          type="number"
          min="0"
          value={numeroStrutture}
          placeholder="Numero Strutture"
          onChange={(e) => setNumeroStrutture(e.target.value === "" ? 0 : Number(e.target.value))}
          className="commesse-input"
        />
        <input
          type="number"
          min="0"
          value={numeroModuli}
          placeholder="Numero Moduli"
          onChange={(e) => setNumeroModuli(e.target.value === "" ? 0 : Number(e.target.value))}
          className="commesse-input"
        />
        <button onClick={handleAdd} className="commesse-button">
          Aggiungi
        </button>
      </div>

      <table className="commesse-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Località</th>
            <th>Coordinate</th>
            <th>Numero Pali</th>
            <th>Numero Strutture</th>
            <th>Numero Moduli</th>
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
                  <input
                    value={editLocalita}
                    onChange={(e) => setEditLocalita(e.target.value)}
                    className="commesse-input"
                  />
                ) : (
                  c.localita
                )}
              </td>
              <td>
                {editId === c.id ? (
                  <input
                    value={editCoordinate}
                    onChange={(e) => setEditCoordinate(e.target.value)}
                    className="commesse-input"
                  />
                ) : (
                  c.coordinate
                )}
              </td>
              <td>
                {editId === c.id ? (
                  <input
                    type="number"
                    min="0"
                    value={editNumeroPali}
                    onChange={(e) =>
                      setEditNumeroPali(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    className="commesse-input"
                  />
                ) : (
                  c.numeroPali
                )}
              </td>
              <td>
                {editId === c.id ? (
                  <input
                    type="number"
                    min="0"
                    value={editNumeroStrutture}
                    onChange={(e) =>
                      setEditNumeroStrutture(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    className="commesse-input"
                  />
                ) : (
                  c.numeroStrutture
                )}
              </td>
              <td>
                {editId === c.id ? (
                  <input
                    type="number"
                    min="0"
                    value={editNumeroModuli}
                    onChange={(e) =>
                      setEditNumeroModuli(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    className="commesse-input"
                  />
                ) : (
                  c.numeroModuli
                )}
              </td>
              <td>
                {editId === c.id ? (
                  <>
                    <button onClick={handleUpdate} className="commesse-button">
                      Salva
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="commesse-button"
                    >
                      Annulla
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(c)}
                      className="commesse-button"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="commesse-button"
                    >
                      X
                    </button>
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
