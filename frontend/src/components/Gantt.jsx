import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

const Gantt = () => {
  const [sideOpen, setSideOpen] = useState(false);
  const [startMonthOffset, setStartMonthOffset] = useState(0);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [selectedCommessaId, setSelectedCommessaId] = useState(null);
  const [selectedAttivita, setSelectedAttivita] = useState(null);
  const [commesse, setCommesse] = useState([]);
  const [viewMode, setViewMode] = useState("trimestre");
  const [commesseAggregatedState, setCommesseAggregated] = useState([]);

  const [draggingCommessa, setDraggingCommessa] = useState(null);
  const dragStartX = useRef(null);
  const dragStartDate = useRef(null);

  useEffect(() => {
    const fetchAssegnazioni = async () => {
      try {
        const response = await fetch("/api/assegnazioni");
        if (!response.ok) throw new Error("Errore nella risposta del server");
        const data = await response.json();
        setAssegnazioni(data);
      } catch (error) {
        console.error("❌ Errore nel recupero delle assegnazioni:", error);
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
        setCommesse(data);
      } catch (error) {
        console.error("❌ Errore nel recupero delle commesse:", error);
      }
    };
    fetchCommesse();
  }, []);

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

  const commesseMap = useMemo(() => {

    const map = {};
    assegnazioni.forEach((a) => {

      const commessaTrovata = commesse.find(
        (c) => String(c.id) === String(a.commessaId)
      );
      if (!commessaTrovata) {
        console.warn("⚠️ Commessa non trovata per assegnazione:", a);
        return;
      }
      const customId = commessaTrovata.id;
      if (!map[customId]) map[customId] = [];
      map[customId].push({
        ...a,
        commessaCustomId: customId,
        nomeCommessa: commessaTrovata.nome,
      });
    });
    return map;
  }, [assegnazioni, commesse]);

  const aggregateCommesse = useCallback(() => {
    return Object.entries(commesseMap).map(([customId, attività]) => {
      const dataInizi = attività.map((a) => new Date(a.dataInizio));
      const dataFini = attività.map((a) => new Date(a.dataFine));
      const minInizio = new Date(Math.min(...dataInizi));
      const maxFine = new Date(Math.max(...dataFini));
      const commessaTrovata = commesse.find(
        (c) => String(c.id) === String(customId)
      );
      const result = {
        commessaId: customId,
        nomeCommessa: commessaTrovata?.nome || "",
        attività,
        dataInizio: minInizio.toISOString(),
        dataFine: maxFine.toISOString(),
      };
      return result;
    });
  }, [commesse, commesseMap]);

  useEffect(() => {
    const aggregated = aggregateCommesse();
    setCommesseAggregated(aggregated);
  }, [aggregateCommesse]);

  const toggleSide = () => {
    setSideOpen((open) => !open);
    setSelectedCommessaId(null);
    setSelectedAttivita(null);
  };

  const handleCommessaClick = (commessa) => {
    setSelectedCommessaId(commessa.commessaId);
    setSelectedAttivita(null);
    if (!sideOpen) setSideOpen(true);
  };

  const handleActivityClick = (attivita) => {
    setSelectedAttivita(attivita);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  const calculateBarPosition = (dataInizioISO, dataFineISO) => {
    const startIndex = getDateIndex(dataInizioISO, months);
    const endIndex = getDateIndex(dataFineISO, months);
    const leftPx = startIndex * 20;
    const widthPx = (endIndex - startIndex + 1) * 20;
    return { leftPx, widthPx };
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Area principale Gantt */}
      <div
        style={{
          flexGrow: 1,
          overflowX: "auto",
          userSelect: draggingCommessa ? "none" : "auto",
          padding: 10,
          borderRight: sideOpen ? "1px solid #ddd" : "none",
          position: "relative",
        }}
      >
        <h2 style={{ marginBottom: 15 }}>Timeline Commesse</h2>

        {/* Controlli vista (trimestre, mese, settimana) */}
        <div style={{ marginBottom: 10 }}>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{ marginRight: 10 }}
          >
            <option value="trimestre">Trimestre</option>
            <option value="mese">Mese</option>
            <option value="settimana">Settimana</option>
          </select>
          <button onClick={() => setStartMonthOffset((o) => o - 1)}>
            {"<"}
          </button>
          <button onClick={() => setStartMonthOffset(0)}>Oggi</button>
          <button onClick={() => setStartMonthOffset((o) => o + 1)}>
            {">"}
          </button>
          <button onClick={toggleSide} style={{ marginLeft: 10 }}>
            {sideOpen ? "Chiudi Dettagli" : "Apri Dettagli"}
          </button>
        </div>

        {/* Timeline header */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #ccc",
            marginBottom: 5,
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            zIndex: 2,
          }}
        >
          {/* Nome commessa colonna */}
          <div
            style={{
              width: 200,
              fontWeight: "bold",
              borderRight: "1px solid #ccc",
              padding: "5px 10px",
            }}
          >
            Commesse
          </div>

          {/* Timeline intestazione mesi + giorni */}
          <div style={{ flexGrow: 1 }}>
            {/* Intestazione mesi */}
            <div style={{ display: "flex" }}>
              {months.map(({ monthIndex, monthYear, days }, i) => {
                const monthName = new Date(
                  monthYear,
                  monthIndex
                ).toLocaleString("default", {
                  month: "long",
                });

                return (
                  <div
                    key={i}
                    style={{
                      width: `${days.length * 20}px`, // larghezza proporzionale al numero di giorni
                      textAlign: "center",
                      borderRight: "1px solid #ccc",
                      fontWeight: "bold",
                    }}
                  >
                    {`${monthName} ${monthYear}`}
                  </div>
                );
              })}
            </div>

            {/* Intestazione giorni raggruppata per mese */}
            <div style={{ display: "flex" }}>
              {months.map(({ days }, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    width: `${days.length * 20}px`,
                    borderRight: "1px solid #ccc",
                  }}
                >
                  {days.map((day, j) => (
                    <div
                      key={`${i}-${j}`}
                      style={{
                        width: "20px",
                        textAlign: "center",
                        fontSize: "12px",
                        borderRight: "1px solid #eee",
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista commesse e barre */}
        <div>
          {commesseAggregatedState.length === 0 ? (
            <div>Nessuna commessa disponibile</div>
          ) : (
            commesseAggregatedState.map((commessa) => {
              const { leftPx, widthPx } = calculateBarPosition(
                commessa.dataInizio,
                commessa.dataFine
              );

              return (
                <div
                  key={commessa.commessaId}
                  style={{
                    display: "flex",
                    borderBottom: "1px solid #eee",
                    height: 40,
                    alignItems: "center",
                    cursor: "pointer",
                    backgroundColor:
                      selectedCommessaId === commessa.commessaId
                        ? "#f0f8ff"
                        : "transparent",
                  }}
                  onClick={() => handleCommessaClick(commessa)}
                  onMouseDown={(e) => {
                    if (
                      e.target.classList.contains("barra-commessa") &&
                      !draggingCommessa
                    ) {
                      setDraggingCommessa(commessa);
                      dragStartX.current = e.clientX;
                      dragStartDate.current = new Date(commessa.dataInizio);
                      e.preventDefault();
                    }
                  }}
                >
                  <div
                    style={{
                      width: 200,
                      paddingLeft: 10,
                      userSelect: "none",
                      fontWeight: "bold",
                      fontSize: 14,
                      color: "#444",
                    }}
                  >
                    {commessa.nomeCommessa}
                  </div>

                  <div
                    style={{
                      position: "relative",
                      flexGrow: 1,
                      height: "100%",
                    }}
                  >
                    <div
                      className="barra-commessa"
                      style={{
                        position: "absolute",
                        left: leftPx,
                        width: widthPx,
                        height: 25,
                        backgroundColor: "#007bff",
                        borderRadius: 4,
                        cursor: "grab",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Side Panel */}
      {sideOpen && (
        <div
          style={{
            width: "400px",
            padding: "20px",
            background: "#f9f9f9",
            overflowY: "auto",
            borderLeft: "1px solid #ccc",
          }}
        >
          <h3>Dettagli Commessa</h3>
          {selectedCommessaId ? (
            <>
              {commesseAggregatedState
                .filter((c) => c.commessaId === selectedCommessaId)
                .map((commessa) => (
                  <div key={commessa.commessaId}>
                    <p>
                      <strong>Nome:</strong> {commessa.nomeCommessa}
                    </p>
                    <p>
                      <strong>Inizio:</strong> {formatDate(commessa.dataInizio)}
                    </p>
                    <p>
                      <strong>Fine:</strong> {formatDate(commessa.dataFine)}
                    </p>

                    <h4 style={{ marginTop: 20 }}>Attività</h4>
                    {commessa.attività.map((attivita) => (
                      <div
                        key={attivita.id}
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          padding: "10px",
                          marginBottom: "10px",
                          background: "#fff",
                        }}
                      >
                        <div
                          onClick={handleActivityClick}
                          style={{
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          {attivita.descrizione}
                        </div>

                        {selectedAttivita &&
                          selectedAttivita.id === attivita.id && (
                            <div
                              style={{ marginTop: "10px", paddingLeft: "10px" }}
                            >
                              <p>
                                <strong>Data inizio:</strong>{" "}
                                {formatDate(attivita.dataInizio)}
                              </p>
                              <p>
                                <strong>Data fine:</strong>{" "}
                                {formatDate(attivita.dataFine)}
                              </p>

                              {/* Esempi di risorse associate */}
                              <p>
                                <strong>Operai:</strong> Mario, Luigi
                              </p>
                              <p>
                                <strong>Mezzi:</strong> Escavatore, Gru
                              </p>
                              <p>
                                <strong>Attrezzi:</strong> Martello, Cacciavite
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ))}
            </>
          ) : (
            <p>Seleziona una commessa per vedere i dettagli</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Gantt;
