import React, { useState, useEffect } from "react";
import axios from "axios";
import TabellaDinamica from "./TabellaDinamica"; 
import AttivitaManager from "./AttivitaManager";

const Tabelle = () => {

  const [mezzi, setMezzi] = useState([]);
  const [attrezzi, setAttrezzi] = useState([]);
  const [operai, setOperai] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const mezziRes = await axios.get("/api/mezzi");
        const attrezziRes = await axios.get("/api/attrezzi");
        const operaiRes = await axios.get("/api/operai");
        setMezzi(mezziRes.data);
        setAttrezzi(attrezziRes.data);
        setOperai(operaiRes.data);
      } catch (err) {
        console.error("Errore caricamento dati", err);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className="wrapper">
      <h1>Gestione Tabelle Dinamiche</h1>
      </div>

      <TabellaDinamica titolo="Mezzi" endpoint="/api/mezzi" />
      <TabellaDinamica titolo="Operai" endpoint="/api/operai" />
      <TabellaDinamica titolo="Attrezzi" endpoint="/api/attrezzi" />

      <div>
        <AttivitaManager
          endpoint="/api/attivita"
          mezzi={mezzi}
          attrezzi={attrezzi}
          operai={operai}
          commessaId={null}
          mode="default"   
        />
      </div>
    </div>
  );
};

export default Tabelle;
