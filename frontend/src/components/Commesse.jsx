import React, { useEffect, useState } from "react";
import AttivitaManager from "./AttivitaManager";
import axios from "axios";
import Gantt from "./gantt";

const GestioneCommesse = () => {
  const [commesse, setCommesse] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    localita: "",
    coordinate: "",
    numeroPali: "",
    numeroStrutture: "",
    numeroModuli: "",
    dataInizio: "",
    dataFine: "",
  });

  const [mezzi, setMezzi] = useState([]);
  const [attrezzi, setAttrezzi] = useState([]);
  const [operai, setOperai] = useState([]);
  const [expandedCommessa, setExpandedCommessa] = useState(null);

  useEffect(() => {
    const fetchDati = async () => {
      try {
        const [mezziRes, attrezziRes, operaiRes, commesseRes] =
          await Promise.all([
            axios.get("/api/mezzi"),
            axios.get("/api/attrezzi"),
            axios.get("/api/operai"),
            axios.get("/api/commesse"),
          ]);

        setMezzi(mezziRes.data);
        setAttrezzi(attrezziRes.data);
        setOperai(operaiRes.data);

        // Mappo commesse per garantire attivita come array di id
        const commesseConAttivitaId = commesseRes.data.map((commessa) => ({
          ...commessa,
          attivita: Array.isArray(commessa.attivita)
            ? commessa.attivita.map((a) => (typeof a === "object" ? a._id : a))
            : [],
        }));
        setCommesse(commesseConAttivitaId);
      } catch (error) {
        console.error("Errore caricando dati:", error);
      }
    };

    fetchDati();
  }, []);

  const fetchCommesse = async () => {
    try {
      const res = await axios.get("/api/commesse");
      const commesseConAttivitaId = res.data.map((commessa) => ({
        ...commessa,
        attivita: Array.isArray(commessa.attivita)
          ? commessa.attivita.map((a) => (typeof a === "object" ? a._id : a))
          : [],
      }));
      setCommesse(commesseConAttivitaId);
    } catch (err) {
      console.error("Errore caricando commesse:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { _id, ...data } = form;

    // Converte i campi numerici
    const payload = {
      ...data,
      numeroPali: parseInt(data.numeroPali, 10) || 0,
      numeroStrutture: parseInt(data.numeroStrutture, 10) || 0,
      numeroModuli: parseInt(data.numeroModuli, 10) || 0,
      attivita: [],
    };

    try {
      if (_id) {
        await axios.put(`/api/commesse/${_id}`, payload);
      } else {
        await axios.post("/api/commesse", payload);
      }

      setForm({
        nome: "",
        localita: "",
        coordinate: "",
        numeroPali: "",
        numeroStrutture: "",
        numeroModuli: "",
        dataInizio: "",
        dataFine: "",
      });

      fetchCommesse();
    } catch (error) {
      console.error("Errore nel salvataggio commessa:", error);
    }
  };

  const handleDeleteCommessa = async (id) => {
    try {
      await axios.delete(`/api/commesse/${id}`);
      fetchCommesse();
    } catch (error) {
      console.error("Errore eliminando commessa:", error);
    }
  };

  const handleEditCommessa = (commessa) => {
    setForm({
      nome: commessa.nome || "",
      localita: commessa.localita || "",
      coordinate: commessa.coordinate || "",
      numeroPali: commessa.numeroPali || "",
      numeroStrutture: commessa.numeroStrutture || "",
      numeroModuli: commessa.numeroModuli || "",
      dataInizio: commessa.dataInizio
        ? commessa.dataInizio.substring(0, 10)
        : "",
      dataFine: commessa.dataFine ? commessa.dataFine.substring(0, 10) : "",
      _id: commessa._id,
    });
  };

  // Aggiungi o rimuovi attività dalla commessa selezionata
  const onToggleAttivita = async (attivitaId, isChecked) => {
    if (!expandedCommessa) return;

    try {
      const commessa = commesse.find((c) => c._id === expandedCommessa);
      if (!commessa) return;

      let nuovaListaAttivita;
      if (isChecked) {
        nuovaListaAttivita = commessa.attivita.includes(attivitaId)
          ? commessa.attivita
          : [...commessa.attivita, attivitaId];
      } else {
        nuovaListaAttivita = commessa.attivita.filter(
          (id) => id !== attivitaId
        );
      }

      // Aggiorno backend
      await axios.put(`/api/commesse/${commessa._id}`, {
        ...commessa,
        attivita: nuovaListaAttivita,
      });

      // Aggiorno stato locale
      setCommesse((prev) =>
        prev.map((c) =>
          c._id === commessa._id ? { ...c, attivita: nuovaListaAttivita } : c
        )
      );
    } catch (error) {
      console.error("Errore aggiornando attività commessa", error);
    }
  };

  return (
    <div>
      <h1>Gestione Commesse</h1>

      <form onSubmit={handleSubmit}>
        {Object.keys(form)
          .filter((key) => key !== "_id")
          .map((key) => (
            <div key={key}>
              <input
                type={key.includes("data") ? "date" : "text"}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={key}
              />
            </div>
          ))}
        <button type="submit">Crea/Modifica Commessa</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Località</th>
            <th>Coordinate</th>
            <th>Numero Pali</th>
            <th>Numero Strutture</th>
            <th>Numero Moduli</th>
            <th>Data Inizio</th>
            <th>Data Fine</th>
            <th>Attività</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {commesse.map((commessa) => (
            <React.Fragment key={commessa._id}>
              <tr key={`main-${commessa._id}`}>
                <td>{commessa.nome}</td>
                <td>{commessa.localita}</td>
                <td>{commessa.coordinate}</td>
                <td>{commessa.numeroPali}</td>
                <td>{commessa.numeroStrutture}</td>
                <td>{commessa.numeroModuli}</td>
                <td>{commessa.dataInizio?.substring(0, 10)}</td>
                <td>{commessa.dataFine?.substring(0, 10)}</td>
                <td>
                  <button
                    onClick={() =>
                      setExpandedCommessa(
                        expandedCommessa === commessa._id ? null : commessa._id
                      )
                    }
                  >
                    {expandedCommessa === commessa._id
                      ? "Nascondi Attività"
                      : "Mostra Attività"}
                  </button>
                </td>
                <td>
                  <button onClick={() => handleEditCommessa(commessa)}>
                    Modifica
                  </button>
                  <button onClick={() => handleDeleteCommessa(commessa._id)}>
                    Elimina
                  </button>
                </td>
              </tr>

              {expandedCommessa === commessa._id && (
                <tr key={`expanded-${commessa._id}`}>
                  <td colSpan="10">
                    <AttivitaManager
                      endpoint="/api/attivita"
                      mezzi={mezzi}
                      attrezzi={attrezzi}
                      operai={operai}
                      commessaId={commessa._id}
                      attivitaSelezionate={commessa.attivita || []}
                      onToggleAttivita={onToggleAttivita}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <Gantt />
    </div>
  );
};

export default GestioneCommesse;
