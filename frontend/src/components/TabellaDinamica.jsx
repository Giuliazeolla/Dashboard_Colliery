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
        (!selectedItem || item.id !== selectedItem.id)
    );
    if (nomeEsiste) {
      alert("Nome già presente");
      return;
    }

    try {
      if (selectedItem) {
        const res = await axios.put(`${endpoint}/${selectedItem.id}`, {
          nome: nomePulito,
        });
        setItems((prev) =>
          prev.map((item) => (item.id === selectedItem.id ? res.data : item))
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
      await axios.delete(`${endpoint}/${selectedItem.id}`);
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
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
    <div className="tabella-container">
      <h2>{titolo}</h2>
      <div className="tabella-input-group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Aggiungi ${titolo.toLowerCase()}`}
        />
        <button onClick={handleSave}>Salva</button>
        <button onClick={handleDelete}>Elimina</button>
      </div>
      <table className="tabella-table">
        <thead>
          <tr>
            <th>Nome</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => handleSelect(item)}
              className={selectedItem?.id === item.id ? "selected" : ""}
            >
              <td>{item.nome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
