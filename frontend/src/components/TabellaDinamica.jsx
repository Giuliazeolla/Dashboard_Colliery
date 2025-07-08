import { useState, useEffect } from "react";
import axios from "axios";

export default function TabellaDinamica({ titolo, endpoint }) {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get(endpoint);
        setItems(res.data);
      } catch (err) {
        console.error("Errore caricamento:", err);
      }
    };
    fetchItems();
  }, [endpoint]);

  const handleSave = async () => {
    const nomePulito = inputValue.trim();
    if (!nomePulito) return;

    // Verifica duplicati locali
    const nomeEsiste = items.some(
      (item) =>
        item.nome.toLowerCase() === nomePulito.toLowerCase() &&
        (!selectedItem || item._id !== selectedItem._id)
    );
    if (nomeEsiste) {
      alert("Nome già presente");
      return;
    }

    try {
      if (selectedItem) {
        const res = await axios.put(`${endpoint}/${selectedItem._id}`, {
          nome: nomePulito,
        });
        setItems((prev) =>
          prev.map((item) => (item._id === selectedItem._id ? res.data : item))
        );
      } else {
        const res = await axios.post(endpoint, { nome: nomePulito });
        setItems((prev) => [...prev, res.data]);
      }
      setInputValue("");
      setSelectedItem(null);
    } catch (err) {
      alert("Errore salvataggio", err);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await axios.delete(`${endpoint}/${selectedItem._id}`);
      setItems((prev) => prev.filter((item) => item._id !== selectedItem._id));
      setInputValue("");
      setSelectedItem(null);
    } catch (err) {
      alert("Errore eliminazione", err);
    }
  };

  const handleSelect = (item) => {
    setInputValue(item.nome);
    setSelectedItem(item);
  };

  return (
    <div>
      <h2>{titolo}</h2>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Aggiungi ${titolo.toLowerCase()}`}
        />
        <button onClick={handleSave}>
          Salva
        </button>
        <button onClick={handleDelete}>
          Elimina
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item._id}
              onClick={() => handleSelect(item)}
            >
              <td>{item.nome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
