import React, { useEffect, useState } from "react";
import axios from "axios";

function AttivitaManager({ endpoint, mezzi, commessaId, attrezzi, operai }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const mostraMessaggio = (msg, isError = false) => {
    if (isError) {
      alert(`Errore: ${msg}`);
      console.error(msg);
    } else {
      alert(msg);
      console.log(msg);
    }
  };

  // Qui la checkbox principale associa o disassocia la commessa all'attività (commessaId su attivita)
  const handleCheckboxChange = async (att) => {
    const isAssociated = att.commessaId === commessaId;
    const newCommessaId = isAssociated ? null : commessaId;

    // Aggiorna subito lo stato locale per renderizzare subito il checkbox
    setItems((prev) =>
      prev.map((item) =>
        item.id === att.id ? { ...item, commessaId: newCommessaId } : item
      )
    );

    try {
      const res = await axios.put(`${endpoint}/${att.id}/commessa`, {
        commessaId: newCommessaId,
      });

      // Aggiorna con risposta server per eventuali correzioni
      setItems((prev) =>
        prev.map((item) => (item.id === att.id ? res.data : item))
      );
    } catch (err) {
      mostraMessaggio("Errore aggiornamento associazione commessa", true);
      console.error(err);
      // opzionalmente rifai fetch o rollback
      fetchItems();
    }
  };

  // Controlla se un elemento (mezzo/attrezzo/operaio) è associato all'attività tramite att.associazioni
  const isChecked = (att, tipo = null, idElemento = null) => {
    if (!tipo || !idElemento) {
      // Se non specificato tipo o idElemento, controllo se commessaId coincide
      return att.commessaId === commessaId;
    }

    const associati = att.associazioni?.[tipo] || [];

    return associati.some((e) => {
      // Se e è oggetto con id
      if (typeof e === "object" && e !== null && "id" in e) {
        return e.id === idElemento;
      }
      // Se è id semplice
      return e === idElemento;
    });
  };

  const fetchItems = React.useCallback(async () => {
    try {
      const res = await axios.get(endpoint);
      setItems(res.data);
    } catch (err) {
      mostraMessaggio("Errore caricamento attività", true);
      console.error(err);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSave = async () => {
    const nomePulito = inputValue.trim();
    if (!nomePulito) return;

    const nomeEsiste = items.some(
      (item) =>
        item.nome.toLowerCase() === nomePulito.toLowerCase() &&
        (!selectedItem || item.id !== selectedItem.id)
    );
    if (nomeEsiste) {
      mostraMessaggio("Nome già presente", true);
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
        mostraMessaggio("Attività modificata");
      } else {
        const res = await axios.post(endpoint, { nome: nomePulito });
        setItems((prev) => [...prev, res.data]);
        mostraMessaggio("Attività aggiunta");
      }
      setInputValue("");
      setSelectedItem(null);
    } catch (err) {
      if (err.response?.status === 409) {
        mostraMessaggio("Nome già esistente (server)", true);
      } else {
        mostraMessaggio("Errore durante il salvataggio", true);
      }
      console.error(err);
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setInputValue(item.nome);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm("Sei sicuro di eliminare questa attività?")) return;

    try {
      await axios.delete(`${endpoint}/${selectedItem.id}`);
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      setInputValue("");
      setSelectedItem(null);
      mostraMessaggio("Attività eliminata");
    } catch (err) {
      mostraMessaggio("Errore eliminazione", true);
      console.error(err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAssociazioniChange = async (tipo, idAttivita, idElemento) => {
    // Trova l’attività da aggiornare
    const attivitaOriginale = items.find((att) => att.id === idAttivita);
    if (!attivitaOriginale) return;

    // Prepara le nuove associazioni
    const nuoveAssociazioni = {
      mezzi:
        attivitaOriginale.associazioni?.mezzi?.map((m) =>
          typeof m === "object" ? m.id : m
        ) || [],
      attrezzi:
        attivitaOriginale.associazioni?.attrezzi?.map((a) =>
          typeof a === "object" ? a.id : a
        ) || [],
      operai:
        attivitaOriginale.associazioni?.operai?.map((o) =>
          typeof o === "object" ? o.id : o
        ) || [],
    };

    // Aggiungi o rimuovi l'idElemento
    const arr = nuoveAssociazioni[tipo];
    const idx = arr.indexOf(idElemento);
    if (idx === -1) {
      arr.push(idElemento);
    } else {
      arr.splice(idx, 1);
    }

    // Crea attività aggiornata
    const updatedAttivita = {
      ...attivitaOriginale,
      associazioni: nuoveAssociazioni,
    };

    // Aggiorna lo stato
    setItems((prev) =>
      prev.map((att) => (att.id === idAttivita ? updatedAttivita : att))
    );

    // Invia update al backend
    try {
      await axios.put(
        `${endpoint}/${idAttivita}/associazioni`,
        nuoveAssociazioni
      );
    } catch (err) {
      mostraMessaggio("Errore aggiornamento associazioni", true);
      console.error(err);
      fetchItems(); // opzionale rollback
    }
  };

  return (
    <div>
      <h2>Gestione Attività</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Nome attività"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-3 py-1 mr-2"
        >
          {selectedItem ? "Modifica" : "Aggiungi"}
        </button>
        {selectedItem && (
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-3 py-1"
          >
            Elimina
          </button>
        )}
      </div>

      <table className="border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2">Associa</th>
            <th className="border border-gray-400 p-2">Nome Attività</th>
            <th className="border border-gray-400 p-2">Dettagli</th>
          </tr>
        </thead>
        <tbody>
          {items.map((att) => (
            <React.Fragment key={att.id}>
              <tr
                className={`cursor-pointer ${
                  selectedItem?.id === att.id ? "bg-yellow-100" : ""
                }`}
                onClick={() => handleSelect(att)}
              >
                <td className="border border-gray-400 text-center p-2">
                  <input
                    type="checkbox"
                    checked={att.commessaId === commessaId}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(att);
                    }}
                  />
                </td>
                <td className="border border-gray-400 p-2">{att.nome}</td>
                <td className="border border-gray-400 p-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(att.id);
                    }}
                    aria-label="Espandi dettagli"
                    className="underline text-blue-600"
                  >
                    {expandedId === att.id ? "Chiudi" : "Dettagli"}
                  </button>
                </td>
              </tr>

              {expandedId === att.id && (
                <tr>
                  <td
                    colSpan={3}
                    className="border border-gray-400 p-4 bg-gray-50"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Mezzi</h4>
                        {mezzi.length === 0 && <p>Nessun mezzo disponibile</p>}
                        {mezzi.map((m) => (
                          <label key={m.id} className="block">
                            <input
                              type="checkbox"
                              checked={isChecked(att, "mezzi", m.id)}
                              onChange={() =>
                                handleAssociazioniChange("mezzi", att.id, m.id)
                              }
                            />{" "}
                            {m.nome}
                          </label>
                        ))}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Attrezzi</h4>
                        {attrezzi.length === 0 && (
                          <p>Nessun attrezzo disponibile</p>
                        )}
                        {attrezzi.map((a) => (
                          <label key={a.id} className="block">
                            <input
                              type="checkbox"
                              checked={isChecked(att, "attrezzi", a.id)}
                              onChange={() =>
                                handleAssociazioniChange(
                                  "attrezzi",
                                  att.id,
                                  a.id
                                )
                              }
                            />{" "}
                            {a.nome}
                          </label>
                        ))}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Operai</h4>
                        {operai.length === 0 && (
                          <p>Nessun operaio disponibile</p>
                        )}
                        {operai.map((o) => (
                          <label key={o.id} className="block">
                            <input
                              type="checkbox"
                              checked={isChecked(att, "operai", o.id)}
                              onChange={() =>
                                handleAssociazioniChange("operai", att.id, o.id)
                              }
                            />{" "}
                            {o.nome}
                          </label>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AttivitaManager;
