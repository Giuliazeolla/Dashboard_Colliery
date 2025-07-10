import React, { useEffect, useState } from "react";
import axios from "axios";

function AttivitaManager({
  endpoint,
  mezzi,
  commessaId = null,
  attrezzi,
  operai,
}) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const inModalitaCommessa = !!commessaId;

  const mostraMessaggio = (msg, isError = false) => {
    if (isError) {
      alert(`Errore: ${msg}`);
      console.error(msg);
    } else {
      alert(msg);
      console.log(msg);
    }
  };

  const handleCheckboxChange = async (att) => {
    const isAssociated = att.commessaId === commessaId;
    const newCommessaId = isAssociated ? null : commessaId;

    setItems((prev) =>
      prev.map((item) =>
        item.id === att.id ? { ...item, commessaId: newCommessaId } : item
      )
    );

    try {
      const res = await axios.put(`${endpoint}/${att.id}/commessa`, {
        commessaId: newCommessaId,
      });

      console.log("Associazione Commessa:", res.data);

      setItems((prev) =>
        prev.map((item) =>
          item.id === att.id ? { ...item, commessaId: newCommessaId } : item
        )
      );
    } catch (err) {
      mostraMessaggio("Errore aggiornamento associazione commessa", true);
      console.error(err);
      fetchItems();
    }
  };

  const isChecked = (att, tipo = null, idElemento = null) => {
    if (!tipo || !idElemento) {
      return att.commessaId === commessaId;
    }

    const associati = att.associazioni?.[tipo] || [];
    return associati.some((e) =>
      typeof e === "object" ? e.id === idElemento : e === idElemento
    );
  };

  const fetchItems = React.useCallback(async () => {
    try {
      const res = await axios.get(endpoint);
      const datiConAssociazioni = res.data.map((att) => ({
        ...att,
        associazioni: {
          mezzi: att.mezzi ? att.mezzi.map((m) => m.id) : [],
          attrezzi: att.attrezzi ? att.attrezzi.map((a) => a.id) : [],
          operai: att.operai ? att.operai.map((o) => o.id) : [],
        },
      }));
      setItems(datiConAssociazioni);
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
    const attivitaOriginale = items.find((att) => att.id === idAttivita);
    if (!attivitaOriginale) return;

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

    const arr = nuoveAssociazioni[tipo];
    const idx = arr.indexOf(idElemento);
    if (idx === -1) {
      arr.push(idElemento);
    } else {
      arr.splice(idx, 1);
    }

    const updatedAttivita = {
      ...attivitaOriginale,
      associazioni: nuoveAssociazioni,
    };

    setItems((prev) =>
      prev.map((att) => (att.id === idAttivita ? updatedAttivita : att))
    );

    try {
      await axios.put(
        `${endpoint}/${idAttivita}/associazioni`,
        nuoveAssociazioni
      );
    } catch (err) {
      mostraMessaggio("Errore aggiornamento associazioni", true);
      console.error(err);
      fetchItems();
    }
  };

  return (
    <div className="wrapper">
      <div className="attivita-container">
        <h2 className="attivita-header wrapper">
          Gestione Attività {inModalitaCommessa && `(modalità commessa)`}
        </h2>

        {!inModalitaCommessa && (
          <div className="attivita-form">
            <input
              type="text"
              placeholder="Nome attività"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="attivita-input"
            />
            <button onClick={handleSave} className="btn btn-primary">
              {selectedItem ? "Modifica" : "Aggiungi"}
            </button>
            {selectedItem && (
              <button onClick={handleDelete} className="btn btn-danger">
                Elimina
              </button>
            )}
          </div>
        )}

        <table className="attivita-table">
          <thead>
            <tr>
              {inModalitaCommessa && <th>Associa</th>}
              <th>Nome Attività</th>
              <th>Dettagli</th>
            </tr>
          </thead>
          <tbody>
            {items.map((att) => (
              <React.Fragment key={att.id}>
                <tr
                  className={`attivita-row ${
                    selectedItem?.id === att.id ? "selected" : ""
                  }`}
                  onClick={() => !inModalitaCommessa && handleSelect(att)}
                >
                  {inModalitaCommessa && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={att.commessaId === commessaId}
                        onChange={() => handleCheckboxChange(att)}
                      />
                    </td>
                  )}
                  <td>{att.nome}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(att.id);
                      }}
                      className="btn-dettagli"
                      aria-label="Espandi dettagli"
                    >
                      {expandedId === att.id ? "Chiudi" : "Dettagli"}
                    </button>
                  </td>
                </tr>

                {expandedId === att.id && (
                  <tr>
                    <td
                      colSpan={inModalitaCommessa ? 3 : 2}
                      className="associazioni-container"
                    >
                      <strong>Associazioni:</strong>
                      <div className="associazioni-tables">
                        {[
                          { tipo: "mezzi", lista: mezzi },
                          { tipo: "attrezzi", lista: attrezzi },
                          { tipo: "operai", lista: operai },
                        ].map(({ tipo, lista }) => (
                          <table key={tipo} className="associazioni-table">
                            <thead>
                              <tr>
                                <th colSpan={2} className="associazioni-header">
                                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {lista.map((el) => (
                                <tr key={el.id}>
                                  <td className="checkbox-cell">
                                    <input
                                      type="checkbox"
                                      checked={isChecked(att, tipo, el.id)}
                                      onChange={() =>
                                        handleAssociazioniChange(
                                          tipo,
                                          att.id,
                                          el.id
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="nome-cell">{el.nome}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttivitaManager;
