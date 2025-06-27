import React, { useState, useEffect } from "react";

const Gantt = () => {
  const [sideOpen, setSideOpen] = useState(false);
  const [startMonthOffset, setStartMonthOffset] = useState(0);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [selectedCommessaId, setSelectedCommessaId] = useState(null); // id commessa selezionata per espansione
  const [selectedCommessaDettaglio, setSelectedCommessaDettaglio] =
    useState(null); // dati per side panel
  const [commesse, setCommesse] = useState([]);
  const [viewMode, setViewMode] = useState("trimestre");

  useEffect(() => {
    const fetchAssegnazioni = async () => {
      try {
        const response = await fetch("/api/assegnazioni");
        if (!response.ok) throw new Error("Errore nella risposta del server");
        const data = await response.json();
        setAssegnazioni(data);
      } catch (error) {
        console.error("Errore nel recupero delle assegnazioni:", error);
      }
    };
    fetchAssegnazioni();
  }, []);

  useEffect(() => {
    const fetchCommesse = async () => {
      try {
        const response = await fetch("/api/commesse");
        if (!response.ok)
          throw new Error("Errore nella risposta delle commesse");
        const data = await response.json();
        setCommesse(data); // <-- qui assegni l'array di commesse
      } catch (error) {
        console.error("Errore nel recupero delle commesse:", error);
      }
    };
    fetchCommesse();
  }, []);

  // Calcola indice assoluto (giorni) nella timeline trimestrale di una data
  const getDateIndex = (date, months) => {
    const d = new Date(date);
    let index = 0;
    for (const { monthIndex, monthYear, days } of months) {
      if (d.getFullYear() === monthYear && d.getMonth() === monthIndex) {
        index += d.getDate() - 1;
        break;
      }
      index += days.length;
    }
    return index;
  };

  // Genera array 3 mesi a partire dall'offset in mesi rispetto ad oggi
  const getQuarterDays = (offset) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const year = today.getFullYear();
    const startMonth = currentMonth + offset;

    const months = [];
    for (let i = 0; i < 3; i++) {
      let monthIndex = (startMonth + i) % 12;
      let yearOffset = Math.floor((startMonth + i) / 12);
      if (monthIndex < 0) {
        monthIndex += 12;
        yearOffset -= 1;
      }
      const monthYear = year + yearOffset;
      const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate();
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        days.push(d);
      }
      months.push({ monthIndex, monthYear, days });
    }
    return months;
  };

  const getMonthDays = (offset) => {
    const today = new Date();
    const monthIndex = today.getMonth() + offset;
    const year = today.getFullYear() + Math.floor(monthIndex / 12);
    const realMonth = (monthIndex + 12) % 12;
    const daysInMonth = new Date(year, realMonth + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return [{ monthIndex: realMonth, monthYear: year, days }];
  };

  const getWeekDays = (offset) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + offset * 7);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date.getDate());
    }
    return [
      {
        monthIndex: start.getMonth(),
        monthYear: start.getFullYear(),
        days: week,
      },
    ];
  };

  const months =
    viewMode === "trimestre"
      ? getQuarterDays(startMonthOffset)
      : viewMode === "mese"
      ? getMonthDays(startMonthOffset)
      : getWeekDays(startMonthOffset);

  const totalDays = months.reduce((acc, m) => acc + m.days.length, 0);

  const monthNames = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];

  const commesseMap = {};

  assegnazioni.forEach((a) => {
    // a.commessaId è MongoDB _id, devo trovare l'id personalizzato corrispondente
    const commessaTrovata = commesse.find(
      (c) => String(c._id) === String(a.commessaId)
    );
    const customId = commessaTrovata ? commessaTrovata.id : a.commessaId; // fallback su mongoId

    if (!commesseMap[customId]) commesseMap[customId] = [];
    commesseMap[customId].push({
      ...a,
      commessaCustomId: customId,
      nomeCommessa: commessaTrovata?.nome || "Nome non trovato",
    });
  });

  const commesseAggregated = Object.entries(commesseMap).map(
    ([customId, attività]) => {
      const dataInizi = attività.map((a) => new Date(a.dataInizio));
      const dataFini = attività.map((a) => new Date(a.dataFine));
      const minInizio = new Date(Math.min(...dataInizi));
      const maxFine = new Date(Math.max(...dataFini));

      // Trova la commessa usando l'id personalizzato
      const commessaTrovata = commesse.find((c) => c.id === customId);

      return {
        commessaId: customId, // qui è l'id personalizzato
        nomeCommessa: commessaTrovata?.nome || "Nome non trovato",
        attività,
        dataInizio: minInizio.toISOString(),
        dataFine: maxFine.toISOString(),
      };
    }
  );

  // Quando si apre/chiude il side panel manualmente, se si chiude resetta selezione
  const toggleSide = () => {
    if (sideOpen) {
      setSelectedCommessaDettaglio(null);
      setSelectedCommessaId(null);
    }
    setSideOpen(!sideOpen);
  };

  // Funzione per gestire click su commessa
  const handleCommessaClick = (commessa) => {
    setSelectedCommessaId(commessa.commessaId); // qui è il customId
    setSelectedCommessaDettaglio(null);
    if (!sideOpen) setSideOpen(true);
  };

  // Clic su attività (dettaglio nel side panel)
  const handleActivityClick = (attivita) => {
    setSelectedCommessaDettaglio(attivita);
  };

  // Torna alla vista lista commesse e chiude dettaglio attività
  const handleBackToList = () => {
    setSelectedCommessaDettaglio(null);
    setSelectedCommessaId(null);
  };

  // Funzione per renderizzare barra data
  const renderBar = (start, end, color, offsetLeft = 150, height = 18) => {
    const startIndex = getDateIndex(start, months);
    const endIndex = getDateIndex(end, months);
    if (endIndex < 0 || startIndex >= totalDays) return null; // fuori range

    const barLeft = offsetLeft + startIndex * 20; // larghezza 20px per giorno
    const barWidth = (endIndex - startIndex + 1) * 20;

    return (
      <div
        style={{
          position: "absolute",
          left: barLeft,
          top: (28 - height) / 2,
          height,
          width: barWidth,
          backgroundColor: color,
          borderRadius: 4,
          opacity: 0.8,
        }}
      />
    );
  };

  // Colori per commesse / attività
  const colors = [
    "#4caf50",
    "#2196f3",
    "#ff9800",
    "#9c27b0",
    "#f44336",
    "#00bcd4",
    "#ff5722",
    "#3f51b5",
  ];
  const getColorForCommessa = (id) => {
    const idx =
      Math.abs(id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
      colors.length;
    return colors[idx];
  };

  console.log(commesse[0]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 10, left: 60, zIndex: 10 }}>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          style={{ padding: 5 }}
        >
          <option value="trimestre">Trimestre</option>
          <option value="mese">Mese</option>
          <option value="settimana">Settimana</option>
        </select>
      </div>
      {/* Side Panel */}
      <div
        style={{
          width: sideOpen ? 250 : 40,
          backgroundColor: "#222",
          color: "#fff",
          transition: "width 0.3s",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: sideOpen ? "flex-start" : "center",
          padding: "10px",
          fontSize: "12px",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 5,
        }}
      >
        <button
          onClick={toggleSide}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            alignSelf: sideOpen ? "flex-end" : "center",
            marginBottom: 10,
          }}
          aria-label={sideOpen ? "Chiudi pannello" : "Apri pannello"}
        >
          {sideOpen ? "×" : "≡"}
        </button>

        {sideOpen && (
          <>
            {selectedCommessaDettaglio ? (
              // Dettaglio attività selezionata
              <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                <h3>Dettagli Attività</h3>
                <div>
                  <p>
                    <strong>Commessa:</strong>{" "}
                    {selectedCommessaDettaglio.commessaCustomId ||
                      selectedCommessaDettaglio.commessaId}
                  </p>
                  <p>
                    <strong>Attività:</strong>{" "}
                    {selectedCommessaDettaglio.attivita}
                  </p>
                  <p>
                    <strong>Data Inizio:</strong>{" "}
                    {new Date(
                      selectedCommessaDettaglio.dataInizio
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Data Fine:</strong>{" "}
                    {new Date(
                      selectedCommessaDettaglio.dataFine
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Operai:</strong>{" "}
                    {selectedCommessaDettaglio.operai &&
                    selectedCommessaDettaglio.operai.length > 0
                      ? selectedCommessaDettaglio.operai.join(", ")
                      : "Nessuno"}
                  </p>
                  <p>
                    <strong>Mezzi:</strong>{" "}
                    {selectedCommessaDettaglio.mezzi &&
                    selectedCommessaDettaglio.mezzi.length > 0
                      ? selectedCommessaDettaglio.mezzi.join(", ")
                      : "Nessuno"}
                  </p>
                  <p>
                    <strong>Attrezzi:</strong>{" "}
                    {selectedCommessaDettaglio.attrezzi &&
                    selectedCommessaDettaglio.attrezzi.length > 0
                      ? selectedCommessaDettaglio.attrezzi.join(", ")
                      : "Nessuno"}
                  </p>
                  <button
                    onClick={handleBackToList}
                    style={{ marginTop: 10, cursor: "pointer" }}
                  >
                    Torna alle Commesse
                  </button>
                </div>
              </div>
            ) : selectedCommessaId ? (
              // Lista attività commessa selezionata
              <>
                <h3 style={{ fontSize: 14, marginBottom: 10 }}>
                  Attività Commessa
                </h3>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: 12,
                    maxHeight: "calc(100vh - 120px)",
                    overflowY: "auto",
                  }}
                >
                  {commesseMap[selectedCommessaId]?.map((att, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleActivityClick(att)}
                      style={{
                        cursor: "pointer",
                        marginBottom: 6,
                        padding: 6,
                        borderRadius: 4,
                        backgroundColor: "#444",
                      }}
                      title={`${att.attivita} (${new Date(
                        att.dataInizio
                      ).toLocaleDateString()} - ${new Date(
                        att.dataFine
                      ).toLocaleDateString()})`}
                    >
                      {att.attivita}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleBackToList}
                  style={{ marginTop: 10, cursor: "pointer" }}
                >
                  Chiudi attività
                </button>
              </>
            ) : (
              // Lista commesse da selezionare
              <>
                <h3 style={{ fontSize: 14, marginBottom: 10 }}>Commesse</h3>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: 12,
                    maxHeight: "calc(100vh - 120px)",
                    overflowY: "auto",
                  }}
                >
                  {commesseAggregated.length === 0 && <p>Nessuna commessa.</p>}
                  {commesseAggregated.map((commessa) => (
                    <li
                      key={commessa.commessaId}
                      onClick={() => handleCommessaClick(commessa)}
                      style={{
                        cursor: "pointer",
                        marginBottom: 6,
                        padding: 6,
                        borderRadius: 4,
                        backgroundColor: "#444",
                      }}
                      title={`Periodo: ${new Date(
                        commessa.dataInizio
                      ).toLocaleDateString()} - ${new Date(
                        commessa.dataFine
                      ).toLocaleDateString()}`}
                    >
                      {commessa.commessaId}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {/* Contenuto principale: timeline */}
      <div
        style={{
          width: `calc(100vw - ${sideOpen ? 250 : 40}px)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          padding: 10,
        }}
      >
        {/* Controlli cambio trimestre */}
        <div
          style={{
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => setStartMonthOffset(startMonthOffset - 3)}
            title="Trimestre precedente"
            style={{ cursor: "pointer" }}
          >
            ←
          </button>
          <div style={{ fontWeight: "bold" }}>
            {monthNames[months[0].monthIndex]} {months[0].monthYear} -{" "}
            {monthNames[months[2].monthIndex]} {months[2].monthYear}
          </div>
          <button
            onClick={() => setStartMonthOffset(startMonthOffset + 3)}
            title="Trimestre successivo"
            style={{ cursor: "pointer" }}
          >
            →
          </button>
        </div>

        <div>
          {/* Timeline mesi */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #aaa",
              fontSize: 13,
              fontWeight: "bold",
              color: "#333",
              userSelect: "none",
            }}
          >
            {/* Colonna "Commesse" */}
            <div
              style={{
                width: "100px",
                flexShrink: 0,
                flexGrow: 0,
                marginTop: "20px",
                borderRight: "1px solid #ccc",
              }}
            >
              Commesse
            </div>

            {/* Mesi */}
            <div
              style={{
                flex: 1,
                display: "flex",
                borderLeft: "1px solid #ccc",
                overflowX: "hidden", // Impedisce overflow orizzontale
                flexWrap: "nowrap", // Impedisce wrapping
              }}
            >
              {months.map(({ monthIndex, monthYear, days }) => (
                <div
                  key={`${monthYear}-${monthIndex}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRight: "1px solid #ccc",
                    minWidth: days.length * 18,
                  }}
                >
                  {/* Nome mese */}
                  <div
                    style={{
                      height: 25,
                      backgroundColor: "#ddd",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderBottom: "1px solid #ccc",
                    }}
                  >
                    {monthNames[monthIndex]} {monthYear}
                  </div>

                  {/* Giorni */}
                  <div style={{ display: "flex" }}>
                    {days.map((day) => (
                      <div
                        key={day}
                        style={{
                          width: 20,
                          height: 20,
                          textAlign: "center",
                          lineHeight: "20px",
                          borderRight: "1px solid #eee",
                          fontSize: 10,
                          color: "#666",
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Righe commesse e attività */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            fontSize: 12,
            borderTop: "1px solid #ccc",
            borderBottom: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Lista commesse */}
          {commesseAggregated.map((commessa) => {
            const color = getColorForCommessa(commessa.commessaId);
            const isSelected = commessa.commessaId === selectedCommessaId;

            return (
              <div
                key={commessa.commessaId}
                style={{ display: "flex", borderBottom: "1px solid #ddd" }}
              >
                {/* Colonna nomi commessa/attività */}
                <div
                  style={{
                    width: 100,
                    borderRight: "1px solid #ccc",
                    backgroundColor: isSelected ? "#def" : "transparent",
                    cursor: "pointer",
                    padding: "4px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  onClick={() => handleCommessaClick(commessa)}
                  title={commessa.commessaId}
                >
                  <strong>{commessa.commessaId}</strong>
                </div>

                {/* Barra commessa */}
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    overflow: "hidden",
                    borderLeft: "1px solid #ccc",
                    whiteSpace: "nowrap",
                  }}
                >
                  {renderBar(
                    commessa.dataInizio,
                    commessa.dataFine,
                    color,
                    0,
                    18
                  )}

                  {/* Attività */}
                  <div>
                    {commesseMap[commessa.commessaId].map((attivita, idx) => {
                      const bar = renderBar(
                        attivita.dataInizio,
                        attivita.dataFine,
                        color,
                        0,
                        12
                      );
                      return (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            height: 20,
                            cursor: "pointer",
                            marginTop: 2,
                            backgroundColor:
                              selectedCommessaDettaglio &&
                              selectedCommessaDettaglio === attivita
                                ? "#b0d4ff"
                                : "transparent",
                          }}
                          onClick={() => handleActivityClick(attivita)}
                          title={`${attivita.attivita} (${new Date(
                            attivita.dataInizio
                          ).toLocaleDateString()} - ${new Date(
                            attivita.dataFine
                          ).toLocaleDateString()})`}
                        >
                          {bar}
                          <span
                            style={{
                              position: "absolute",
                              left: 5,
                              top: 2,
                              fontSize: 10,
                              color: "#000",
                              userSelect: "none",
                            }}
                          >
                            {attivita.attivita}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Gantt;
