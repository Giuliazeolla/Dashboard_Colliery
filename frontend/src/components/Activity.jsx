import React, { useState, useEffect } from "react";

const STATIC_ACTIVITIES = [
  "Progettazione Preliminare",
  "Pull-out Test",
  "Progettazione Esecutiva",
  "Esecutivi di Officina",
  "Ordine Fornitore",
  "Consegna Pali",
  "Infissione Pali",
  "Consegna Struttura",
  "Montaggio Struttura",
  "Montaggio Moduli",
  "Collaudo"
];

export default function AttivitaTable() {

const [workers, setWorkers] = useState([]);
const [machines, setMachines] = useState([]);
const [attrezzi, setAttrezzi] = useState([]);

  const [commesse, setCommesse] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [wRes, mRes, aRes, cRes] = await Promise.all([
          fetch("/api/workers"),
          fetch("/api/machines"),
          fetch("/api/attrezzi"),
          fetch("/api/commesse")
        ]);

        if (!wRes.ok || !mRes.ok || !aRes.ok || !cRes.ok) {
          throw new Error("Errore nel caricamento dati");
        }

        const [workersData, machinesData, attrezziData, commesseData] = await Promise.all([
          wRes.json(),
          mRes.json(),
          aRes.json(),
          cRes.json()
        ]);

        setWorkers(workersData);
        setMachines(machinesData);
        setAttrezzi(attrezziData);
        setCommesse(commesseData);

        // Inizializza righe con attività statiche e campi vuoti
        setRows(STATIC_ACTIVITIES.map(nome => ({
          nome,
          commessaId: "",
          operai: [],
          mezzi: [],
          attrezzi: [],
          dataInizio: "",
          dataFine: ""
        })));
      } catch (error) {
        console.error(error);
        alert("Errore nel caricamento dati");
      }
    }

    loadData();
  }, []);



  const handleChange = (i, field, value) => {
    const copy = [...rows];
    copy[i] = { ...copy[i], [field]: value };
    setRows(copy);
  };

   const handleSave = async (i) => {
    const payload = rows[i];
    try {
      const res = await fetch("/api/attivita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Errore nel salvataggio attività");

      alert(`Attività "${payload.nome}" salvata!`);
    } catch (error) {
      console.error(error);
      alert("Errore nel salvataggio dell'attività");
    }
  };

  return (
    <div className="attivita-table">
      <h3>Attività</h3>
      <table>
        <thead>
          <tr>
            <th>Attività</th>
            <th>Commessa</th>
            <th>Operai</th>
            <th>Mezzi</th>
            <th>Attrezzi</th>
            <th>Inizio</th>
            <th>Fine</th>
            <th>Salva</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.nome}</td>
              {/* Select singola commessa dinamica */}
              <td>
                <select
                  value={r.commessaId}
                  onChange={e => handleChange(i, "commessaId", e.target.value)}
                >
                  <option value="">— Seleziona —</option>
                  {commesse.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </td>
              {/* Select multipla operai */}
              <td>
                <select
                  multiple
                  value={r.operai}
                  onChange={e =>
                    handleChange(
                      i,
                      "operai",
                      Array.from(e.target.selectedOptions, o => o.value)
                    )
                  }
                >
                  {workers.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.nome}
                    </option>
                  ))}
                </select>
              </td>
              {/* Select multipla mezzi */}
              <td>
                <select
                  multiple
                  value={r.mezzi}
                  onChange={e =>
                    handleChange(
                      i,
                      "mezzi",
                      Array.from(e.target.selectedOptions, o => o.value)
                    )
                  }
                >
                  {machines.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  multiple
                  value={r.attrezzi}
                  onChange={e =>
                    handleChange(
                      i,
                      "attrezzi",
                      Array.from(e.target.selectedOptions, o => o.value)
                    )
                  }
                >
                  {attrezzi.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </td>
              {/* Date input */}
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
