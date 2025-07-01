import React, { useEffect, useState } from "react";
import Gantt from "./gantt";

import {
  STATIC_WORKERS,
  STATIC_MACHINES,
  STATIC_ATTREZZI,
  STATIC_ATTIVITA,
} from "../../../backend/staticsData";

const API = "http://localhost:5000/api";

export default function Dashboard() {
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCommessaData, setNewCommessaData] = useState({
    nome: "",
    localita: "",
    coordinate: "",
    numeroPali: "",
    numeroStrutture: "",
    numeroModuli: "",
  });

  const [commessaAttivita, setCommessaAttivita] = useState({});

  const fetchCommesse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/commesse`);
      if (!res.ok) throw new Error("Errore nel caricamento commesse");
      const data = await res.json();
      setCommesse(data);
    } catch (err) {
      console.error("Errore nel caricamento commesse:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommesse();
  }, []);

  // Funzione per aggiungere o togliere attività da commessa
  function toggleAttivita(commessaId, attivitaNome) {
    setCommessaAttivita((prev) => {
      const commessaState = prev[commessaId] || {
        attivitaSelezionate: {},
        showActivities: true,
      };

      const attivitaSelezionate = { ...commessaState.attivitaSelezionate };

      if (attivitaSelezionate[attivitaNome]) {
        // Deselect attività: rimuovo
        delete attivitaSelezionate[attivitaNome];
      } else {
        // Aggiungo attività con array vuoti per mezzi, attrezzi, operai
        attivitaSelezionate[attivitaNome] = {
          mezzi: [],
          attrezzi: [],
          operai: [],
        };
      }

      return {
        ...prev,
        [commessaId]: {
          ...commessaState,
          attivitaSelezionate,
          showActivities: true,
        },
      };
    });
  }

  // Funzione per aggiungere mezzo, attrezzo o operaio a attività di commessa
  function aggiungiElemento(commessaId, attivitaNome, tipoElemento, elemento) {
    setCommessaAttivita((prev) => {
      const commessaState = prev[commessaId];
      if (!commessaState) return prev;

      const attivita = commessaState.attivitaSelezionate[attivitaNome];
      if (!attivita) return prev;

      // Aggiungo solo se non presente
      if (!attivita[tipoElemento].includes(elemento)) {
        const nuovoElemento = [...attivita[tipoElemento], elemento];

        return {
          ...prev,
          [commessaId]: {
            ...commessaState,
            attivitaSelezionate: {
              ...commessaState.attivitaSelezionate,
              [attivitaNome]: {
                ...attivita,
                [tipoElemento]: nuovoElemento,
              },
            },
          },
        };
      }
      return prev;
    });
  }

  // Funzione per rimuovere mezzo, attrezzo o operaio da attività di commessa
  function rimuoviElemento(commessaId, attivitaNome, tipoElemento, elemento) {
    setCommessaAttivita((prev) => {
      const commessaState = prev[commessaId];
      if (!commessaState) return prev;

      const attivita = commessaState.attivitaSelezionate[attivitaNome];
      if (!attivita) return prev;

      const nuovoArray = attivita[tipoElemento].filter((el) => el !== elemento);

      return {
        ...prev,
        [commessaId]: {
          ...commessaState,
          attivitaSelezionate: {
            ...commessaState.attivitaSelezionate,
            [attivitaNome]: {
              ...attivita,
              [tipoElemento]: nuovoArray,
            },
          },
        },
      };
    });
  }

  // Toggle visibilità attività per commessa
  function toggleShowActivities(commessaId) {
    setCommessaAttivita((prev) => {
      const commessaState = prev[commessaId] || {
        attivitaSelezionate: {},
        showActivities: false,
      };
      return {
        ...prev,
        [commessaId]: {
          ...commessaState,
          showActivities: !commessaState.showActivities,
        },
      };
    });
  }

  // Funzione per salvare nuova commessa (come da codice originale)
  async function salvaCommessa() {
    if (!newCommessaData.nome.trim()) {
      alert("Nome commessa è obbligatorio");
      return;
    }
    const nuova = {
      nome: newCommessaData.nome.trim(),
      localita: newCommessaData.localita.trim(),
      coordinate: newCommessaData.coordinate.trim(),
      numeroPali: Number(newCommessaData.numeroPali),
      numeroStrutture: Number(newCommessaData.numeroStrutture),
      numeroModuli: Number(newCommessaData.numeroModuli),
    };
    try {
      const res = await fetch("/api/commesse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuova),
      });
      if (!res.ok) throw new Error("Errore nella creazione");
      alert("Commessa creata con successo");
      setNewCommessaData({
        nome: "",
        localita: "",
        coordinate: "",
        numeroPali: "",
        numeroStrutture: "",
        numeroModuli: "",
      });
      fetchCommesse();
    } catch (err) {
      alert("Errore: " + err.message);
    }
  }

  // Funzione per modificare una commessa esistente
  async function handleModificaCommessa(id, datiAggiornati) {
    try {
      const res = await fetch(`/api/commesse/${id}`, {
        method: "PUT", // o PATCH se preferisci aggiornamento parziale
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datiAggiornati),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento della commessa");
      alert("Commessa aggiornata con successo");
      fetchCommesse(); // Ricarico la lista aggiornata
    } catch (err) {
      alert("Errore: " + err.message);
    }
  }

  // Funzione per eliminare una commessa
  async function handleEliminaCommessa(id) {
    if (!window.confirm("Sei sicuro di voler eliminare questa commessa?"))
      return;
    try {
      const res = await fetch(`/api/commesse/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Errore nell'eliminazione della commessa");
      alert("Commessa eliminata con successo");
      fetchCommesse(); // Ricarico la lista aggiornata
    } catch (err) {
      alert("Errore: " + err.message);
    }
  }

  const handleSalvaAttivita = async (commessaId) => {
    const dati = commessaAttivita[commessaId]?.attivitaSelezionate;
    if (!dati || Object.keys(dati).length === 0) {
      alert("Nessuna attività selezionata.");
      return;
    }

    // Prepara i dati in formato serializzabile
    const attivitaArray = Object.entries(dati).map(
      ([nomeAttivita, dettagli]) => ({
        nome: nomeAttivita,
        mezzi: dettagli.mezzi || [],
        attrezzi: dettagli.attrezzi || [],
        operai: dettagli.operai || [],
      })
    );

    try {
      const response = await fetch(`/api/commesse/${commessaId}/attivita`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attivita: attivitaArray }),
      });

      if (!response.ok) {
        throw new Error(`Errore nel salvataggio: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert("Attività salvate con successo!");

        // Se il backend ti restituisce le attività salvate, aggiorna lo stato
        if (data.attivita) {
          setCommessaAttivita((prev) => ({
            ...prev,
            [commessaId]: {
              ...prev[commessaId],
              attivitaSalvate: data.attivita,
              attivitaSelezionate: {}, // eventualmente svuota le selezioni dopo il salvataggio
            },
          }));
        }
      } else {
        alert(`Salvataggio fallito: ${data.message || "Errore sconosciuto"}`);
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore nel salvataggio delle attività.");
    }
  };

  const handleDisassociaAttivita = async (commessaId) => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/attivita/disassocia-commessa/${commessaId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Errore nella disassociazione delle attività");
      }

      // Pulisci lo stato locale delle attività associate a questa commessa
      setCommessaAttivita((prev) => ({
        ...prev,
        [commessaId]: {
          ...prev[commessaId],
          attivitaSelezionate: {}, // svuota
          showActivities: false,
        },
      }));

      alert("Tutte le attività sono state disassociate dalla commessa.");
    } catch (error) {
      console.error("Errore disassociazione attività:", error);
      alert("Errore nella disassociazione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ position: "relative" }}>
      <h2 className="dashboard-title">Workhube</h2>
      {/* Sezione Commesse */}
      <h3 className="section__title">Commesse</h3>
      {loading ? (
        <p>Caricamento commesse...</p>
      ) : (
        <table className="commesse-table" role="grid">
          <thead>
            <tr>
              <th>Nome Commessa</th>
              <th>Località</th>
              <th>Coordinate</th>
              <th>Numero Pali</th>
              <th>Numero Strutture</th>
              <th>Numero Moduli</th>
              <th>Aggiungi Attività</th> {/* Nuova colonna */}
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {commesse.map((commessa) => {
              const commessaId = commessa.id || commessa._id; // qui definisco commessaId

              return (
                <React.Fragment key={commessaId}>
                  <tr>
                    <td>{commessa.nome}</td>
                    <td>{commessa.localita}</td>
                    <td>{commessa.coordinate}</td>
                    <td>{commessa.numeroPali}</td>
                    <td>{commessa.numeroStrutture}</td>
                    <td>{commessa.numeroModuli}</td>
                    <td>
                      <button
                        className="button__normal"
                        onClick={() => toggleShowActivities(commessaId)}
                        aria-expanded={
                          commessaAttivita[commessaId]?.showActivities
                            ? "true"
                            : "false"
                        }
                        aria-controls={`attivita-list-${commessaId}`}
                      >
                        {commessaAttivita[commessaId]?.showActivities
                          ? "Nascondi Attività"
                          : "Mostra Attività"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="button__small"
                        onClick={() => {
                          const nuovoNome = prompt(
                            "Modifica nome commessa:",
                            commessa.nome
                          );
                          if (nuovoNome === null) return;

                          const nuovaLocalita = prompt(
                            "Modifica località:",
                            commessa.localita
                          );
                          if (nuovaLocalita === null) return;

                          const nuoveCoordinate = prompt(
                            "Modifica coordinate:",
                            commessa.coordinate
                          );
                          if (nuoveCoordinate === null) return;

                          const nuovoNumeroPali = prompt(
                            "Modifica numero pali:",
                            commessa.numeroPali?.toString() || ""
                          );
                          if (nuovoNumeroPali === null) return;

                          const nuovoNumeroStrutture = prompt(
                            "Modifica numero strutture:",
                            commessa.numeroStrutture?.toString() || ""
                          );
                          if (nuovoNumeroStrutture === null) return;

                          const nuovoNumeroModuli = prompt(
                            "Modifica numero moduli:",
                            commessa.numeroModuli?.toString() || ""
                          );
                          if (nuovoNumeroModuli === null) return;

                          const datiAggiornati = {
                            nome: nuovoNome.trim(),
                            localita: nuovaLocalita.trim(),
                            coordinate: nuoveCoordinate.trim(),
                            numeroPali: Number(nuovoNumeroPali),
                            numeroStrutture: Number(nuovoNumeroStrutture),
                            numeroModuli: Number(nuovoNumeroModuli),
                          };

                          if (!datiAggiornati.nome) {
                            alert("Il nome non può essere vuoto");
                            return;
                          }

                          handleModificaCommessa(commessaId, datiAggiornati);
                        }}
                        aria-label={`Modifica commessa ${commessa.nome}`}
                      >
                        Modifica Commessa
                      </button>

                      <button
                        className="button__small button__danger"
                        onClick={() => handleEliminaCommessa(commessaId)}
                        aria-label={`Elimina commessa ${commessa.nome}`}
                      >
                        Elimina Commessa
                      </button>
                    </td>
                  </tr>

                  {commessaAttivita[commessaId]?.showActivities && (
                    <tr>
                      <td colSpan={8} id={`attivita-list-${commessaId}`}>
                        <div
                          className="attivita-container"
                          style={{ border: "1px solid #ccc", padding: "10px" }}
                        >
                          <h4>Seleziona Attività</h4>

                          {STATIC_ATTIVITA.map((attivitaNome) => {
                            const selected =
                              commessaAttivita[commessaId]
                                ?.attivitaSelezionate?.[attivitaNome] !==
                              undefined;

                            return (
                              <div
                                key={attivitaNome}
                                style={{ marginBottom: "8px" }}
                              >
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() =>
                                      toggleAttivita(commessaId, attivitaNome)
                                    }
                                  />{" "}
                                  {attivitaNome}
                                </label>

                                {selected && (
                                  <div
                                    className="dettagli-attivita"
                                    style={{
                                      marginLeft: "20px",
                                      marginTop: "6px",
                                      padding: "10px",
                                      backgroundColor: "#f9f9f9",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {/* --- MEZZI --- */}
                                    <div>
                                      <strong>Mezzi:</strong>{" "}
                                      {commessaAttivita[
                                        commessaId
                                      ].attivitaSelezionate[
                                        attivitaNome
                                      ].mezzi.join(", ") || "Nessuno"}
                                      <br />
                                      {STATIC_MACHINES.map((mezzo) => (
                                        <button
                                          key={mezzo}
                                          className="button__small"
                                          onClick={() =>
                                            aggiungiElemento(
                                              commessaId,
                                              attivitaNome,
                                              "mezzi",
                                              mezzo
                                            )
                                          }
                                          aria-label={`Aggiungi mezzo ${mezzo}`}
                                          disabled={commessaAttivita[
                                            commessaId
                                          ].attivitaSelezionate[
                                            attivitaNome
                                          ].mezzi.includes(mezzo)}
                                        >
                                          + {mezzo}
                                        </button>
                                      ))}
                                      {commessaAttivita[commessaId]
                                        .attivitaSelezionate[attivitaNome].mezzi
                                        .length > 0 && (
                                        <div>
                                          {commessaAttivita[
                                            commessaId
                                          ].attivitaSelezionate[
                                            attivitaNome
                                          ].mezzi.map((mezzo) => (
                                            <button
                                              key={`${mezzo}-rimuovi`}
                                              className="button__small button__danger"
                                              onClick={() =>
                                                rimuoviElemento(
                                                  commessaId,
                                                  attivitaNome,
                                                  "mezzi",
                                                  mezzo
                                                )
                                              }
                                              aria-label={`Rimuovi mezzo ${mezzo}`}
                                            >
                                              x {mezzo}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* --- ATTREZZI --- */}
                                    <div style={{ marginTop: "10px" }}>
                                      <strong>Attrezzi:</strong>{" "}
                                      {commessaAttivita[
                                        commessaId
                                      ].attivitaSelezionate[
                                        attivitaNome
                                      ].attrezzi.join(", ") || "Nessuno"}
                                      <br />
                                      {STATIC_ATTREZZI.map((attrezzo) => (
                                        <button
                                          key={attrezzo}
                                          className="button__small"
                                          onClick={() =>
                                            aggiungiElemento(
                                              commessaId,
                                              attivitaNome,
                                              "attrezzi",
                                              attrezzo
                                            )
                                          }
                                          aria-label={`Aggiungi attrezzo ${attrezzo}`}
                                          disabled={commessaAttivita[
                                            commessaId
                                          ].attivitaSelezionate[
                                            attivitaNome
                                          ].attrezzi.includes(attrezzo)}
                                        >
                                          + {attrezzo}
                                        </button>
                                      ))}
                                      {commessaAttivita[commessaId]
                                        .attivitaSelezionate[attivitaNome]
                                        .attrezzi.length > 0 && (
                                        <div>
                                          {commessaAttivita[
                                            commessaId
                                          ].attivitaSelezionate[
                                            attivitaNome
                                          ].attrezzi.map((attrezzo) => (
                                            <button
                                              key={`${attrezzo}-rimuovi`}
                                              className="button__small button__danger"
                                              onClick={() =>
                                                rimuoviElemento(
                                                  commessaId,
                                                  attivitaNome,
                                                  "attrezzi",
                                                  attrezzo
                                                )
                                              }
                                              aria-label={`Rimuovi attrezzo ${attrezzo}`}
                                            >
                                              x {attrezzo}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* --- OPERAI --- */}
                                    <div style={{ marginTop: "10px" }}>
                                      <strong>Operai:</strong>{" "}
                                      {commessaAttivita[
                                        commessaId
                                      ].attivitaSelezionate[
                                        attivitaNome
                                      ].operai.join(", ") || "Nessuno"}
                                      <br />
                                      {STATIC_WORKERS.map((operaio) => (
                                        <button
                                          key={operaio}
                                          className="button__small"
                                          onClick={() =>
                                            aggiungiElemento(
                                              commessaId,
                                              attivitaNome,
                                              "operai",
                                              operaio
                                            )
                                          }
                                          aria-label={`Aggiungi operaio ${operaio}`}
                                          disabled={commessaAttivita[
                                            commessaId
                                          ].attivitaSelezionate[
                                            attivitaNome
                                          ].operai.includes(operaio)}
                                        >
                                          + {operaio}
                                        </button>
                                      ))}
                                      {commessaAttivita[commessaId]
                                        .attivitaSelezionate[attivitaNome]
                                        .operai.length > 0 && (
                                        <div>
                                          {commessaAttivita[
                                            commessaId
                                          ].attivitaSelezionate[
                                            attivitaNome
                                          ].operai.map((operaio) => (
                                            <button
                                              key={`${operaio}-rimuovi`}
                                              className="button__small button__danger"
                                              onClick={() =>
                                                rimuoviElemento(
                                                  commessaId,
                                                  attivitaNome,
                                                  "operai",
                                                  operaio
                                                )
                                              }
                                              aria-label={`Rimuovi operaio ${operaio}`}
                                            >
                                              x {operaio}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <button
                            className="button__save"
                            onClick={() => handleSalvaAttivita(commessaId)}
                          >
                            Salva
                          </button>

                          <Button
                            onClick={() => handleDisassociaAttivita(commessaId)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Rimuovi tutte le attività dalla commessa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Form per nuova commessa */}
      <div className="new-commessa-form">
        <h3>Crea Nuova Commessa</h3>
        <input
          aria-label="Nome commessa"
          type="text"
          placeholder="Nome commessa"
          value={newCommessaData.nome}
          onChange={(e) =>
            setNewCommessaData({ ...newCommessaData, nome: e.target.value })
          }
        />
        <input
          aria-label="Località"
          type="text"
          placeholder="Località"
          value={newCommessaData.localita}
          onChange={(e) =>
            setNewCommessaData({ ...newCommessaData, localita: e.target.value })
          }
        />
        <input
          aria-label="Coordinate"
          type="text"
          placeholder="Coordinate"
          value={newCommessaData.coordinate}
          onChange={(e) =>
            setNewCommessaData({
              ...newCommessaData,
              coordinate: e.target.value,
            })
          }
        />
        <input
          aria-label="Numero Pali"
          type="number"
          placeholder="Numero Pali"
          value={newCommessaData.numeroPali}
          onChange={(e) =>
            setNewCommessaData({
              ...newCommessaData,
              numeroPali: e.target.value,
            })
          }
        />
        <input
          aria-label="Numero Strutture"
          type="number"
          placeholder="Numero Strutture"
          value={newCommessaData.numeroStrutture}
          onChange={(e) =>
            setNewCommessaData({
              ...newCommessaData,
              numeroStrutture: e.target.value,
            })
          }
        />
        <input
          aria-label="Numero Moduli"
          type="number"
          placeholder="Numero Moduli"
          value={newCommessaData.numeroModuli}
          onChange={(e) =>
            setNewCommessaData({
              ...newCommessaData,
              numeroModuli: e.target.value,
            })
          }
        />
        <button
          className="button__small button__success"
          onClick={() => salvaCommessa()}
          aria-label={`Salva commessa ${newCommessaData.nome || ""}`}
        >
          Salva Commessa
        </button>
      </div>

      <Gantt />
    </div>
  );
}
