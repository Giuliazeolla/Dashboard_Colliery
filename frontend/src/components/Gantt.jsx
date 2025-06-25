import React, { useState, useEffect } from "react";

const Gantt = () => {
  const [sideOpen, setSideOpen] = useState(false);
  const [startMonthOffset, setStartMonthOffset] = useState(0);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [selectedCommessaId, setSelectedCommessaId] = useState(null); // id commessa selezionata per espansione
  const [selectedCommessaDettaglio, setSelectedCommessaDettaglio] =
    useState(null); // dati per side panel

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

  const months = getQuarterDays(startMonthOffset);
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

  // Raggruppa assegnazioni per commessa
  const commesseMap = {};
  assegnazioni.forEach((a) => {
    if (!commesseMap[a.commessaId]) commesseMap[a.commessaId] = [];
    commesseMap[a.commessaId].push(a);
  });

  // Per ogni commessa calcola periodo complessivo (min dataInizio e max dataFine)
  const commesseAggregated = Object.entries(commesseMap).map(
    ([commessaId, attività]) => {
      const dataInizi = attività.map((a) => new Date(a.dataInizio));
      const dataFini = attività.map((a) => new Date(a.dataFine));
      const minInizio = new Date(Math.min(...dataInizi));
      const maxFine = new Date(Math.max(...dataFini));
      return {
        commessaId,
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

  // Clic su commessa: seleziona commessa (per zoom e dettaglio)
  const handleCommessaClick = (commessa) => {
    setSelectedCommessaId(commessa.commessaId);
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

    const barLeft = offsetLeft + startIndex * 20; // <-- ridotta da 25px a 20px per miglior adattamento orizzontale
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

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
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
          padding: sideOpen ? "10px" : "10px 0",
        }}
      >
        <button
          onClick={toggleSide}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            marginBottom: sideOpen ? 20 : 0,
          }}
          title={sideOpen ? "Chiudi pannello" : "Apri pannello"}
        >
          {sideOpen ? "←" : "→"}
        </button>

        {sideOpen && (
          <>
            {selectedCommessaDettaglio ? (
              // Dettaglio attività selezionata
              <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                <h3>Dettagli Attività</h3>
                <p>
                  <strong>Commessa:</strong>{" "}
                  {selectedCommessaDettaglio.commessaId}
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
                <button
                  onClick={handleBackToList}
                  style={{ marginTop: 10, cursor: "pointer" }}
                >
                  Torna alle Commesse
                </button>
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
