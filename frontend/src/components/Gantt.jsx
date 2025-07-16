import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

const Gantt = () => {
  const [expandedCommesse, setExpandedCommesse] = useState([]);
  const [expandedAttivita, setExpandedAttivita] = useState([]);
  const [attivitaPerCommessa, setAttivitaPerCommessa] = useState({});
  const [startMonthOffset, setStartMonthOffset] = useState(0);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [selectedCommessaId, setSelectedCommessaId] = useState(null);
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
        console.log("Assegnazioni ricevute:", data);
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



  const fetchAttivita = async (commessaId) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:5000/api/attivita/commessa/${commessaId}`);
      if (!response.ok) throw new Error("Errore nel recupero delle attività");
      const data = await response.json();
      console.log(`🎯 Attività filtrate ricevute per commessa ${commessaId}:`, data);

      setAttivitaPerCommessa(prev => ({
        ...prev,
        [commessaId]: data,
      }));
    } catch (err) {
      setError(err.message);
      setAttivitaPerCommessa(prev => ({
        ...prev,
        [commessaId]: [],
      }));
    }
  };


  useEffect(() => {
    if (!selectedCommessaId) {
      return;
    }
    fetchAttivita(selectedCommessaId);
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


  // ✅ Tronca la data all'inizio del giorno e restituisce un oggetto Date
const truncateToMidnight = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ✅ Calcola l'indice decimale della data
const getDateIndex = (date, dataUnits, view = 'monthly') => {
  const dOriginal = new Date(date);
  let d = new Date(dOriginal);
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (view === 'weekly') {
    d = new Date(d.getTime() + 0.6 * oneDayMs);
  } else if (view === 'quarterly') {
    d = new Date(d.getTime() - 5.2 * oneDayMs);
  } else {
    d = new Date(d.getTime() + 0.5 * oneDayMs);
  }

  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const milliseconds = d.getMilliseconds();

  const fractionOfDay =
  hours / 24 + minutes / 1440 + seconds / 86400 + milliseconds / 86400000;
  const decimalDay = day - 1 + fractionOfDay;

  if (view === 'monthly') {
    let index = 0;
    const localMonth = dOriginal.getMonth();
    const localYear = dOriginal.getFullYear();

    const orderedUnits = [...dataUnits].sort((a, b) => {
      if (a.monthYear !== b.monthYear) return a.monthYear - b.monthYear;
      return a.monthIndex - b.monthIndex;
    });

    for (const unit of orderedUnits) {
      const { monthIndex, monthYear, days } = unit;
      if (monthIndex === localMonth && monthYear === localYear) {
        return index + decimalDay;
      }
      index += days.length;
    }

    return -1;
  }

  if (view === 'weekly') {
    let index = 0;
    for (const unit of dataUnits) {
      const { monthIndex, monthYear, days } = unit;
      for (let i = 0; i < days.length; i++) {
        const currentDay = new Date(monthYear, monthIndex, days[i]);
        if (
          currentDay.getDate() === day &&
          currentDay.getMonth() === d.getMonth() &&
          currentDay.getFullYear() === d.getFullYear()
        ) {
          return index + i + fractionOfDay;
        }
      }
      index += days.length;
    }
  }

  if (view === 'quarterly') {
    const quarterStartMonth = Math.floor(d.getMonth() / 3) * 3;
    let index = 0;

    for (const { monthIndex, monthYear, days } of dataUnits) {
      if (
        monthYear === d.getFullYear() &&
        monthIndex >= quarterStartMonth &&
        monthIndex < quarterStartMonth + 3
      ) {
        if (monthIndex === d.getMonth()) {
          index += decimalDay;
          break;
        } else {
          index += days.length;
        }
      }
    }

    return index;
  }

  // Fallback
  let index = 0;
  for (const { monthIndex, monthYear, days } of dataUnits) {
    if (monthYear === d.getFullYear() && monthIndex === d.getMonth()) {
      index += decimalDay;
      break;
    }
    index += days.length;
  }

  return index;
};

// ✅ Calcola la posizione della barra usando l'indice decimale
const calculateBarPosition = (dataInizio, dataFine, dataUnits, view = 'monthly') => {
  const startIndex = getDateIndex(dataInizio, dataUnits, view);
  const endIndex = getDateIndex(dataFine, dataUnits, view);

  const leftPx = startIndex * 20;
  const widthPx = (endIndex - startIndex + 1) * 20;

  return { leftPx, widthPx };
};

// ✅ Calcola la posizione della barra attività con spostamento decimale
const calcolaBarraAttivita = (attivita, dataUnits, viewMode) => {
  if (!attivita?.dataInizio || !attivita?.durata) {
    return { leftPx: 0, widthPx: 0 };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const spostamentoDecimale = 9.8;

  const dataInizioTroncata = truncateToMidnight(attivita.dataInizio);
  const dataInizio = new Date(dataInizioTroncata.getTime() + spostamentoDecimale * msPerDay);

  const durataMs = (attivita.durata - 1) * msPerDay;
  const dataFine = new Date(dataInizio.getTime() + durataMs);

  const { leftPx, widthPx } = calculateBarPosition(dataInizio, dataFine, dataUnits, viewMode);

  console.log("Data originale:", attivita.dataInizio);
  console.log("Data inizio decimale:", dataInizio);
  console.log("Data fine:", dataFine);

  return { leftPx, widthPx };
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


  const toggleCommessa = (commessaId) => {
    setExpandedCommesse((prevExpanded) => {
      let newExpanded;

      if (prevExpanded.includes(commessaId)) {
        // Se è già aperta, la chiudo
        newExpanded = prevExpanded.filter(id => id !== commessaId);
      } else {
        // Se è chiusa, la apro e fetch attività
        newExpanded = [...prevExpanded, commessaId];
        setSelectedCommessaId(commessaId);
        fetchAttivita(commessaId); // 🔁 Chiamata solo quando si espande
      }

      return newExpanded;
    });
  };

  const handleActivityClick = (attivitaId) => {
    setExpandedAttivita((prev) =>
      prev.includes(attivitaId)
        ? prev.filter((id) => id !== attivitaId)
        : [...prev, attivitaId]
    )
  }

  const colors = ["#FF5101", "#5688c7"];

  const commessaColorMap = {};
  commesseAggregatedState.forEach((commessa, index) => {
    commessaColorMap[commessa.commessaId] = colors[index % colors.length];
  });


  return (
    <div className="gantt-container">
      {/* Gantt principale */}
      <div
        className={`gantt-main ${draggingCommessa ? "no-select" : ""
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
                commessa.dataFine,
                months,
                viewMode === "trimestre"
                  ? "quarterly"
                  : viewMode === "settimana"
                    ? "weekly"
                    : "monthly"
              );

              const isSelected = expandedCommesse.includes(commessa.commessaId);

              return (
                <React.Fragment key={commessa.commessaId}>
                  <div
                    className={`commessa-row ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleCommessa(commessa.commessaId)}
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
                        className="barra-commessa"
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                          backgroundColor: commessaColorMap[commessa.commessaId],
                        }}
                      />
                    </div>
                  </div>

                  {/* Riga Attività collegate */}
                  {isSelected && (
                    <div className="attivita-container">
                      {(attivitaPerCommessa[commessa.commessaId]?.length ?? 0) === 0 ? (
                        <div>Nessuna attività collegata a questa commessa</div>
                      ) : (
                        attivitaPerCommessa[commessa.commessaId].map((attivita, idx) => {
                          const { leftPx, widthPx } = calcolaBarraAttivita(
                            attivita,
                            months,
                            viewMode === "trimestre"
                              ? "quarterly"
                              : viewMode === "settimana"
                                ? "weekly"
                                : "monthly"
                          );

                          console.log("🧱 Attività:", attivita.nome);
                          console.log("👉 leftPx:", leftPx, "widthPx:", widthPx);
                          console.log("📆 Data inizio:", attivita.dataInizio, "Durata:", attivita.durata);
                          console.log("📅 DataUnits:", months);

                          return (
                            <div
                              key={`${commessa.commessaId}-${attivita.id}`}
                              className="attivita-row"
                              onClick={() => handleActivityClick(attivita.id)}
                            >
                              <div className="attivita-title">
                                ↳ {attivita.nome?.trim() || "Attività senza nome"}
                              </div>

                              <div className="attivita-bar-container">
                                <div
                                  className="barra-attivita"
                                  style={{
                                    left: `${leftPx}px`,
                                    width: `${widthPx}px`,
                                    backgroundColor: commessaColorMap[commessa.commessaId],
                                  }}
                                />
                              </div>

                              {expandedAttivita.includes(attivita.id) && (
                                <div className="attivita-details">
                                  <div>
                                    <strong>Operai:</strong>{" "}
                                    {attivita.operai?.length > 0
                                      ? attivita.operai.map(operaio => operaio.nome).join(",")
                                      : "N/D"}
                                  </div>
                                  <div>
                                    <strong>Mezzi:</strong>{" "}
                                    {attivita.mezzi?.length > 0
                                      ? attivita.mezzi.map(mezzo => mezzo.nome).join(",")
                                      : "N/D"}
                                  </div>
                                  <div>
                                    <strong>Attrezzi:</strong>{" "}
                                    {attivita.attrezzi?.length > 0
                                      ? attivita.attrezzi.map(attrezzo => attrezzo.nome).join(",")
                                      : "N/D"}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Gantt;
