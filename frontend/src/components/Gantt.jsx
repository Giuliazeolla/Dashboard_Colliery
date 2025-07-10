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
  const [attivita, setAttivita] = useState([]);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (!selectedCommessaId) {
      setAttivita([]);
      setError(null);
      return;
    }
    const fetchAttivita = async () => {
      try {
        setError(null);
        const response = await fetch(
          `http://localhost:5000/api/attivita/commessa/${selectedCommessaId}`
        );
        if (!response.ok) throw new Error("Errore nel recupero delle attività");
        const data = await response.json();
        setAttivita(data);
      } catch (err) {
        setError(err.message);
        setAttivita([]);
      }
    };
    fetchAttivita();
  }, [selectedCommessaId]);

  // Calcola settimana ISO (numero settimana anno)
  const getISOWeekNumber = (date) => {
    const tmpDate = new Date(date.getTime());
    tmpDate.setHours(0, 0, 0, 0);
    // Giovedì della settimana corrente
    tmpDate.setDate(tmpDate.getDate() + 3 - ((tmpDate.getDay() + 6) % 7));
    const week1 = new Date(tmpDate.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((tmpDate.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      )
    );
  };

  const getDateIndex = (date, months) => {
    const d = new Date(date);
    let index = 0;
    for (const { monthIndex, monthYear, days } of months) {
      if (d.getFullYear() === monthYear && d.getMonth() === monthIndex) {
        index += d.getDate();
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

  // Nuova funzione che restituisce tutte le settimane del mese corrente (con offset)
  const getWeekDays = (offset) => {
    const today = new Date();
    const year =
      today.getFullYear() + Math.floor((today.getMonth() + offset) / 12);
    const month = (today.getMonth() + offset + 12) % 12;

    // Primo giorno del mese
    const firstDay = new Date(year, month, 1);
    // Ultimo giorno del mese
    const lastDay = new Date(year, month + 1, 0);

    // Trova la data del primo lunedì prima o uguale al primo giorno del mese
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstMonday.getDay(); // domenica=0, lun=1,...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // se domenica, torna indietro di 6 giorni, altrimenti alla lunedi
    firstMonday.setDate(firstDay.getDate() + diffToMonday);

    const weeks = [];
    let currentStart = new Date(firstMonday);

    // Itera settimane finché la settimana inizia entro o oltre il mese
    while (currentStart <= lastDay || weeks.length === 0) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentStart);
        d.setDate(currentStart.getDate() + i);
        days.push(d.getDate());
      }
      weeks.push({
        monthIndex: currentStart.getMonth(),
        monthYear: currentStart.getFullYear(),
        days,
        // calcolo settimana ISO sulla data del lunedì della settimana
        weekNumber: getISOWeekNumber(currentStart),
      });
      currentStart.setDate(currentStart.getDate() + 7);
    }

    return weeks;
  };

  const months =
    viewMode === "trimestre"
      ? getQuarterDays(startMonthOffset).map((m) => {
          // aggiungo numero settimana: per il mese non ha senso indicare più numeri settimana,
          // potremmo calcolare la settimana del primo giorno del mese per esempio
          return {
            ...m,
            weekNumber: getISOWeekNumber(
              new Date(m.monthYear, m.monthIndex, 1)
            ),
          };
        })
      : viewMode === "mese"
      ? getMonthDays(startMonthOffset).map((m) => ({
          ...m,
          weekNumber: getISOWeekNumber(new Date(m.monthYear, m.monthIndex, 1)),
        }))
      : getWeekDays(startMonthOffset); // ora ritorna tutte le settimane con numero settimana

  const commesseMap = useMemo(() => {
    const map = {};

    for (const assegnazione of assegnazioni) {
      const commessaId = String(assegnazione.commessaId);
      const commessa = commesse.find((c) => String(c.id) === commessaId);
      if (!commessa) continue;

      if (!map[commessaId]) {
        map[commessaId] = {
          commessa,
          attivita: [],
        };
      }

      map[commessaId].attivita.push(assegnazione);
    }

    return map;
  }, [assegnazioni, commesse]);

  const aggregateCommesse = useCallback(() => {
    return Object.entries(commesseMap).map(
      ([commessaId, { commessa, attivita }]) => {
        const dateStart = attivita.map((a) => new Date(a.dataInizio));
        const dateEnd = attivita.map((a) => new Date(a.dataFine));
        const minInizio = new Date(Math.min(...dateStart));
        const maxFine = new Date(Math.max(...dateEnd));

        return {
          commessaId,
          nomeCommessa: commessa.nome,
          localitaCommessa: commessa.localita,
          coordinateCommessa: commessa.coordinate,
          numeroPaliCommessa: commessa.numeroPali,
          numeroStruttureCommessa: commessa.numeroStrutture,
          numeroModuliCommessa: commessa.numeroModuli,
          attivita,
          dataInizio: minInizio.toISOString(),
          dataFine: maxFine.toISOString(),
        };
      }
    );
  }, [commesseMap]);

  useEffect(() => {
    const aggregated = aggregateCommesse();
    setCommesseAggregated(aggregated);
  }, [aggregateCommesse]);

  const toggleSide = () => {
    setSideOpen((open) => !open);
    setSelectedCommessaId(null);
    setSelectedAttivita();
  };

  const handleCommessaClick = (commessa) => {
    setSelectedCommessaId(commessa.commessaId);
    setSelectedAttivita(null);
    if (!sideOpen) setSideOpen(true);
  };

  const handleActivityClick = (attivita) => {
    setSelectedAttivita((prev) =>
      prev && prev.id === attivita.id ? null : attivita
    );
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  const calculateBarPosition = (dataInizioISO, dataFineISO) => {
    const startIndex = getDateIndex(dataInizioISO, months);
    const endIndex = getDateIndex(dataFineISO, months);
    const leftPx = startIndex * 20;
    const widthPx = (endIndex - startIndex) * 20;
    return { leftPx, widthPx };
  };

  const colors = ["#FF5101", "#5688c7"];

  return (
    <div className="gantt-container">
      {/* Gantt principale */}
      <div
        className={`gantt-main ${sideOpen ? "with-border" : ""} ${
          draggingCommessa ? "no-select" : ""
        }`}
      >
        <h2 className="gantt-title">Timeline Commesse</h2>

        {/* Controlli */}
        <div className="gantt-controls">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
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
          <button onClick={toggleSide} className="btn-side-toggle">
            {sideOpen ? "Chiudi Dettagli" : "Apri Dettagli"}
          </button>
        </div>

        {/* Header timeline */}
        <div className="timeline-header">
          <div className="timeline-col-title">Commesse</div>

          <div className="timeline-date-container">
            {/* Mesi */}
            <div className="timeline-months">
              {viewMode === "settimana"
                ? months.map(({ weekNumber, days }, i) => (
                    <div
                      key={`mese-${i}`}
                      className="timeline-month"
                      style={{ width: `${days.length * 20}px` }}
                    >
                      {`Settimana ${weekNumber}`}
                    </div>
                  ))
                : months.map(({ monthIndex, monthYear, days }, i) => {
                    const monthName = new Date(
                      monthYear,
                      monthIndex
                    ).toLocaleString("default", {
                      month: "long",
                    });
                    return (
                      <div
                        key={`mese-${i}`}
                        className="timeline-month"
                        style={{ width: `${days.length * 20}px` }}
                      >
                        {`${monthName} ${monthYear}`}
                      </div>
                    );
                  })}
            </div>

            {/* Settimane (ISO) */}
            <div className="timeline-weeks">
              {months.flatMap(({ days }, i) => {
                const weeks = [];
                for (let j = 0; j < days.length; j += 7) {
                  const dayNum = days[j];
                  const now = new Date();
                  now.setFullYear(now.getFullYear()); // puoi regolare l'anno se necessario
                  now.setMonth(months[i].monthIndex);
                  now.setDate(dayNum);
                  const weekNumber = getISOWeekNumber(now);
                  weeks.push(
                    <div
                      key={`settimana-${i}-${j}`}
                      className="timeline-week"
                      style={{ width: `${7 * 20}px` }}
                    >
                      Set. {weekNumber}
                    </div>
                  );
                }
                return weeks;
              })}
            </div>

            {/* Giorni */}
            <div className="timeline-days">
              {months.map(({ days }, i) => (
                <div
                  key={`giorni-${i}`}
                  className="timeline-day-group"
                  style={{ width: `${days.length * 20}px` }}
                >
                  {days.map((day, j) => (
                    <div key={`${i}-${j}`} className="timeline-day">
                      {day}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista Commesse */}
        <div>
          {commesseAggregatedState.length === 0 ? (
            <div>Nessuna commessa disponibile</div>
          ) : (
            commesseAggregatedState.map((commessa, index) => {
              const { leftPx, widthPx } = calculateBarPosition(
                commessa.dataInizio,
                commessa.dataFine
              );

              return (
                <div
                  key={commessa.commessaId}
                  className={`commessa-row ${
                    selectedCommessaId === commessa.commessaId ? "selected" : ""
                  }`}
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
                  <div className="commessa-title">{commessa.nomeCommessa}</div>
                  <div className="commessa-bar-container">
                    <div
                      key={commessa.id}
                      className="barra-commessa"
                      style={{
                        left: leftPx,
                        width: widthPx,
                        backgroundColor: colors[index % colors.length],
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
        <div className="side-panel">
          <h3>Dettagli Commessa</h3>
          {selectedCommessaId ? (
            commesseAggregatedState
              .filter((c) => c.commessaId === selectedCommessaId)
              .map((commessa) => (
                <div key={commessa.commessaId}>
                  <p>
                    <strong>Nome Commessa:</strong> {commessa.nomeCommessa}
                  </p>
                  <p>
                    <strong>Località Commessa:</strong>{" "}
                    {commessa.localitaCommessa}
                  </p>
                  <p>
                    <strong>Coordinate Commessa:</strong>{" "}
                    {commessa.coordinateCommessa}
                  </p>
                  <p>
                    <strong>Numero Pali:</strong> {commessa.numeroPaliCommessa}
                  </p>
                  <p>
                    <strong>Numero Strutture:</strong>{" "}
                    {commessa.numeroStruttureCommessa}
                  </p>
                  <p>
                    <strong>Numero Moduli:</strong>{" "}
                    {commessa.numeroModuliCommessa}
                  </p>
                  <p>
                    <strong>Data di Inizio:</strong>{" "}
                    {formatDate(commessa.dataInizio)}
                  </p>
                  <p>
                    <strong>Data di Fine:</strong>{" "}
                    {formatDate(commessa.dataFine)}
                  </p>

                  <h4>Attività</h4>
                  {error && <p className="error">{error}</p>}
                  {!error && attivita.length === 0 && (
                    <p>Nessuna attività associata.</p>
                  )}
                  {attivita.map((att) => (
                    <div key={att.id} className="attivita-box">
                      <div
                        className="attivita-nome"
                        onClick={() => handleActivityClick(att)}
                      >
                        {att.nome}
                      </div>

                      {selectedAttivita?.id === att.id && (
                        <div className="attivita-dettagli">
                          <p>
                            <strong>Operai:</strong>{" "}
                            {att.operai?.length
                              ? att.operai.map((o) => o.nome).join(", ")
                              : "N/D"}
                          </p>
                          <p>
                            <strong>Mezzi:</strong>{" "}
                            {att.mezzi?.length
                              ? att.mezzi.map((m) => m.nome).join(", ")
                              : "N/D"}
                          </p>
                          <p>
                            <strong>Attrezzi:</strong>{" "}
                            {att.attrezzi?.length
                              ? att.attrezzi.map((a) => a.nome).join(", ")
                              : "N/D"}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
          ) : (
            <ul>
              {commesse.map((commessa) => (
                <li key={commessa.commessaId}>{commessa.nome}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Gantt;
