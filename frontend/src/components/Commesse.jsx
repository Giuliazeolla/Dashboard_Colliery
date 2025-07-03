import React, { useEffect, useState } from "react";
import axios from "axios";
import RisorseDashboard from "./Dashboard";

const GestioneCommesse = () => {
  const [commesse, setCommesse] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    localita: "",
    coordinate: "",
    numeroPali: "",
    numeroStrutture: "",
    numeroModuli: "",
  });
  const [attivita, setAttivita] = useState([]);
  const [nuovaAttivita, setNuovaAttivita] = useState("");
  const [expandedCommessa, setExpandedCommessa] = useState(null);
  const [risorsaAperta, setRisorsaAperta] = useState({});

  // Fetch commesse con attività popolate
  const fetchCommesse = async () => {
    try {
      const res = await axios.get("/api/commesse");
      const commesseConIdAttivita = res.data.map((commessa) => ({
        ...commessa,
        attivita: Array.isArray(commessa.attivita)
          ? commessa.attivita.map((a) => (typeof a === "object" ? a._id : a))
          : [],
      }));
      setCommesse(commesseConIdAttivita);
    } catch (err) {
      console.error("Errore caricando commesse:", err);
    }
  };

  const fetchAttivita = async () => {
    try {
      const res = await axios.get("/api/attivita");
      setAttivita(res.data);
    } catch (err) {
      console.error("Errore caricando attivita:", err);
    }
  };

  useEffect(() => {
    fetchCommesse();
    fetchAttivita();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { _id, ...data } = form;

    if (_id) {
      await axios.put(`/api/commesse/${_id}`, data);
    } else {
      await axios.post("/api/commesse", { ...data, attivita: [] });
    }

    setForm({
      nome: "",
      localita: "",
      coordinate: "",
      numeroPali: "",
      numeroStrutture: "",
      numeroModuli: "",
    });

    fetchCommesse();
  };

  const handleAttivitaAdd = async (commessaId) => {
    if (!nuovaAttivita.trim()) return;
    try {
      await axios.post("/api/attivita", { nome: nuovaAttivita, commessaId });
      setNuovaAttivita("");
      fetchAttivita();
      fetchCommesse(); // per aggiornare anche le commesse con la nuova attività eventualmente associata
    } catch (err) {
      console.error("Errore aggiungendo attività:", err);
    }
  };

  const toggleAttivitaCommessa = async (commessaId, attivitaId) => {
    const commessa = commesse.find((c) => c._id === commessaId);
    if (!commessa) {
      console.error("Commessa non trovata con id:", commessaId);
      return;
    }

    const attivitaArray = Array.isArray(commessa.attivita)
      ? commessa.attivita
      : [];

    const esiste = attivitaArray.includes(attivitaId);
    const nuoveAttivita = esiste
      ? attivitaArray.filter((id) => id !== attivitaId)
      : [...attivitaArray, attivitaId];

    try {
      // Aggiorna solo il campo attività tramite PUT
      await axios.put(`/api/commesse/${commessaId}/attivita`, {
        attivitaIds: nuoveAttivita,
      });

      // Aggiorna localmente lo stato
      setCommesse((prevCommesse) =>
        prevCommesse.map((c) =>
          c._id === commessaId ? { ...c, attivita: nuoveAttivita } : c
        )
      );
    } catch (error) {
      console.error("Errore aggiornando le attività della commessa:", error);
    }
  };

  const handleDeleteCommessa = async (id) => {
    await axios.delete(`/api/commesse/${id}`);
    fetchCommesse();
  };

  const handleEditCommessa = (commessa) => {
    setForm({
      nome: commessa.nome || "",
      localita: commessa.localita || "",
      coordinate: commessa.coordinate || "",
      numeroPali: commessa.numeroPali || "",
      numeroStrutture: commessa.numeroStrutture || "",
      numeroModuli: commessa.numeroModuli || "",
      _id: commessa._id,
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestione Commesse</h1>

      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        {Object.keys(form)
          .filter((key) => key !== "_id")
          .map((key) => (
            <input
              key={key}
              type="text"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={key}
              className="border p-2 block w-full"
            />
          ))}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">
          Crea/Modifica Commessa
        </button>
      </form>

      <table className="w-full table-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Nome</th>
            <th className="border px-2 py-1">Località</th>
            <th className="border px-2 py-1">Coordinate</th>
            <th className="border px-2 py-1">Numero Pali</th>
            <th className="border px-2 py-1">Numero Strutture</th>
            <th className="border px-2 py-1">Numero Moduli</th>
            <th className="border px-2 py-1">Attività</th>
            <th className="border px-2 py-1">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {commesse.map((commessa) => (
            <React.Fragment key={commessa._id}>
              <tr>
                <td className="border px-2 py-1">{commessa.nome}</td>
                <td className="border px-2 py-1">{commessa.localita}</td>
                <td className="border px-2 py-1">{commessa.coordinate}</td>
                <td className="border px-2 py-1">{commessa.numeroPali}</td>
                <td className="border px-2 py-1">{commessa.numeroStrutture}</td>
                <td className="border px-2 py-1">{commessa.numeroModuli}</td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() =>
                      setExpandedCommessa(
                        expandedCommessa === commessa._id ? null : commessa._id
                      )
                    }
                    className="bg-blue-500 text-white px-2 py-1 text-sm"
                  >
                    Mostra Attività
                  </button>
                </td>
                <td className="border px-2 py-1 space-x-2 text-center">
                  <button
                    onClick={() => handleEditCommessa(commessa)}
                    className="bg-yellow-500 text-white px-2 py-1 text-sm"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDeleteCommessa(commessa._id)}
                    className="bg-red-500 text-white px-2 py-1 text-sm"
                  >
                    Elimina
                  </button>
                </td>
              </tr>

              {expandedCommessa === commessa._id && (
                <tr>
                  <td colSpan="8" className="border px-2 py-2 bg-gray-50">
                    <div className="mb-2 font-semibold">
                      Attività associate:
                    </div>
                    <div className="space-y-1 mb-4">
                      {attivita.map((att) => {
                        const isChecked = commessa.attivita?.includes(att._id);

                        return (
                          <div
                            key={att._id}
                            className="flex flex-col space-y-1 border-b py-2"
                          >
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked || false}
                                onChange={() =>
                                  toggleAttivitaCommessa(commessa._id, att._id)
                                }
                              />
                              <span>{att.nome}</span>
                            </label>

                            {/* Se è selezionata, mostra i bottoni */}
                            {isChecked && (
                              <div className="flex space-x-2 mt-1">
                                {["operai", "mezzi", "attrezzi"].map((tipo) => (
                                  <button
                                    key={tipo}
                                    onClick={() =>
                                      setRisorsaAperta((prev) => ({
                                        ...prev,
                                        [att._id]:
                                          prev[att._id] === tipo ? null : tipo,
                                      }))
                                    }
                                    className={`px-2 py-1 text-sm rounded border ${
                                      risorsaAperta[att._id] === tipo
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-200"
                                    }`}
                                  >
                                    Mostra{" "}
                                    {tipo.charAt(0).toUpperCase() +
                                      tipo.slice(1)}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Se risorsaAperta per questa attività è impostata, mostra RisorseDashboard */}
                            {isChecked && risorsaAperta[att._id] && (
                              <div className="mt-3 ml-6 border-l-2 border-gray-300 pl-4">
                                <RisorseDashboard
                                  tipo={risorsaAperta[att._id]}
                                  attivitaId={att._id}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={nuovaAttivita}
                        onChange={(e) => setNuovaAttivita(e.target.value)}
                        placeholder="Nuova Attività"
                        className="border p-1 w-1/3"
                      />
                      <button
                        onClick={() => handleAttivitaAdd(commessa._id)}
                        className="bg-green-600 text-white px-3 py-1 text-sm"
                      >
                        Aggiungi Attività
                      </button>
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
};

export default GestioneCommesse;
