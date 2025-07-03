import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const RisorseDashboard = ({ tipo, attivitaId }) => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nome: "" });
  const [aggiuntivo, setAggiuntivo] = useState("");
  const [messaggio, setMessaggio] = useState(null);
  const [errore, setErrore] = useState(null);

  const endpoint = `/api/${tipo}`;

  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get(endpoint, { params: { attivitaId } });
      setItems(res.data);
    } catch (err) {
      mostraMessaggio("Errore durante il recupero degli elementi",err, true);
    }
  }, [endpoint, attivitaId]);

  useEffect(() => {
    if (attivitaId) fetchItems();
  }, [fetchItems, attivitaId]);

  const mostraMessaggio = (msg, isErrore = false) => {
    if (isErrore) {
      setErrore(msg);
    } else {
      setMessaggio(msg);
    }
    setTimeout(() => {
      setMessaggio(null);
      setErrore(null);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await axios.put(`${endpoint}/${selected._id}`, { ...form, attivita: attivitaId });
        mostraMessaggio("Elemento modificato con successo!");
      } else {
        await axios.post(endpoint, { ...form, attivita: attivitaId });
        mostraMessaggio("Elemento creato con successo!");
      }
      setForm({ nome: "" });
      setSelected(null);
      fetchItems();
    } catch (err) {
      mostraMessaggio("Errore durante il salvataggio dell'elemento",err, true);
    }
  };

  const handleEdit = (item) => {
    setForm({ nome: item.nome });
    setSelected(item);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${endpoint}/${id}`);
      mostraMessaggio("Elemento eliminato con successo!");
      fetchItems();
    } catch (err) {
      mostraMessaggio("Errore durante l'eliminazione",err, true);
    }
  };

  const handleAddCustom = async () => {
    if (aggiuntivo.trim()) {
      try {
        await axios.post(endpoint, { nome: aggiuntivo, attivita: attivitaId });
        setAggiuntivo("");
        mostraMessaggio("Elemento aggiunto con successo!");
        fetchItems();
      } catch (err) {
        mostraMessaggio("Errore durante l'aggiunta personalizzata",err, true);
      }
    }
  };

  if (!attivitaId) return <div>Seleziona un'attività per gestire {tipo}</div>;

  return (
    <div className="p-4 border rounded mt-4">
      <h2 className="text-lg font-semibold mb-2 capitalize">Gestione {tipo} per attività</h2>

      {messaggio && <div className="mb-2 p-2 bg-green-100 text-green-800 rounded">{messaggio}</div>}
      {errore && <div className="mb-2 p-2 bg-red-100 text-red-800 rounded">{errore}</div>}

      <form onSubmit={handleSubmit} className="mb-4 flex space-x-2">
        <input
          type="text"
          value={form.nome}
          onChange={(e) => setForm({ nome: e.target.value })}
          className="border p-2 flex-grow"
          placeholder={`Nome ${tipo}`}
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          {selected ? "Modifica" : "Crea"}
        </button>
      </form>

      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          value={aggiuntivo}
          onChange={(e) => setAggiuntivo(e.target.value)}
          placeholder="Aggiungi elemento"
          className="border p-2 flex-grow"
        />
        <button onClick={handleAddCustom} className="bg-green-500 text-white px-4 py-2">
          Aggiungi
        </button>
      </div>

      <ul className="space-y-2 max-h-48 overflow-auto">
        {items.map((item) => (
          <li key={item._id} className="border p-2 flex justify-between items-center rounded">
            <div>{item.nome}</div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(item)}
                className="bg-yellow-500 text-white px-2 py-1 rounded"
              >
                Modifica
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Elimina
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RisorseDashboard;
