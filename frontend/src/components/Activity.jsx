import React, { useState, useEffect } from "react";

const STATIC_ACTIVITIES = [
  "Progettazione esecutiva", "pull-out-test", "disegni esecutivi",
  "ordine fornitore", "consegna pali", "infissione pali",
  "consegna struttura", "montaggio struttura", "montaggio moduli",
  "collaudo"
];

export default function AttivitaTable() {
  const [workers, setWorkers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/workers").then(r=>r.json()).then(setWorkers);
    fetch("/api/machines").then(r=>r.json()).then(setMachines);
    fetch("/api/commesse").then(r=>r.json()).then(setCommesse);
    setRows(STATIC_ACTIVITIES.map(nome => ({
      nome,
      commessaId: "",
      operai: [],
      mezzi: [],
      dataInizio: "",
      dataFine: ""
    })));
  }, []);

  const handleChange = (i, field, value) => {
    const copy = [...rows];
    copy[i] = {...copy[i], [field]: value};
    setRows(copy);
  };

  const handleSave = async (i) => {
    const payload = rows[i];
    await fetch("/api/attivita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    alert(`Attività "${payload.nome}" salvata!`);
  };

  return (
    <div className="attivita-table">
      <h3>Attività</h3>
      <table>
        <thead>
          <tr>
            <th>Attività</th>
            <th>Commessa</th><th>Operai</th><th>Mezzi</th>
            <th>Inizio</th><th>Fine</th><th>Salva</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.nome}</td>
            <td>
              <select
                value={r.commessaId}
                onChange={e => handleChange(i, "commessaId", e.target.value)}
              >
                <option value="">—</option>
                {commesse.map(c =>
                  <option key={c._id} value={c._id}>{c.nome}</option>
                )}
              </select>
            </td>
            <td>
              <select
                multiple
                value={r.operai}
                onChange={(e) =>
                  handleChange(i, "operai", Array.from(e.target.selectedOptions, o => o.value))
                }
              >
                {workers.map(w =>
                  <option key={w._id} value={w._id}>{w.nome}</option>
                )}
              </select>
            </td>
            <td>
              <select
                multiple
                value={r.mezzi}
                onChange={(e) =>
                  handleChange(i, "mezzi", Array.from(e.target.selectedOptions, o => o.value))
                }
              >
                {machines.map(m =>
                  <option key={m._id} value={m._id}>{m.nome}</option>
                )}
              </select>
            </td>
            <td>
              <input
                type="date"
                value={r.dataInizio}
                onChange={e => handleChange(i, "dataInizio", e.target.value)}
              />
            </td>
            <td>
              <input
                type="date"
                value={r.dataFine}
                onChange={e => handleChange(i, "dataFine", e.target.value)}
              />
            </td>
            <td>
              <button disabled={!r.commessaId} onClick={() => handleSave(i)}>
                Salva
              </button>
            </td>
          </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
