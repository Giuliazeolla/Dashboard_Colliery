import React, { useState, useEffect } from "react";

// Funzione per ottenere numero settimane in un mese (approssimazione)
const getWeeksInMonth = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const used = firstDay.getDay() + lastDay.getDate();
  return Math.ceil(used / 7);
};

// Funzione per generare array di giorni del mese
const getDaysInMonth = (year, month) => {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// Dummy dati commesse con attività su date specifiche
const dummyCommesse = [
  {
    id: 1,
    nome: "Commesse A",
    attività: [
      { data: "2025-06-15", descrizione: "Attività 1" },
      { data: "2025-06-17", descrizione: "Attività 2" },
    ],
  },
  {
    id: 2,
    nome: "Commesse B",
    attività: [
      { data: "2025-06-20", descrizione: "Attività X" },
      { data: "2025-07-05", descrizione: "Attività Y" },
    ],
  },
];

const GanttCustom = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  // Calcolo mesi del trimestre corrente (per esempio trimestre 2 = Apr, Mag, Giu)
  // Qui per semplicità prendiamo il trimestre corrente calcolando da mese attuale
  const currentMonth = new Date().getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3);
  const trimestreMesi = [
    currentQuarter * 3,
    currentQuarter * 3 + 1,
    currentQuarter * 3 + 2,
  ];

  // Ottieni giorni di ogni mese del trimestre
  const mesiConGiorni = trimestreMesi.map((m) => ({
    mese: m,
    giorni: getDaysInMonth(year, m),
  }));

  // Funzione per controllare se in una data c'è attività su quella commessa
  const hasAttività = (commessa, day) =>
    commessa.attività.some(
      (att) => att.data === day.toISOString().slice(0, 10)
    );

  return (
    <div style={{ padding: 20 }}>
      <h2>Gantt Personalizzato - Trimestre {currentQuarter + 1} - Anno {year}</h2>

      <div
        style={{
          display: "flex",
          gap: 20,
          overflowX: "auto",
          border: "1px solid #ccc",
          padding: 10,
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
        }}
      >
        {/* Per ogni mese */}
        {mesiConGiorni.map(({ mese, giorni }) => (
          <div
            key={mese}
            style={{
              border: "1px solid #aaa",
              minWidth: 300,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Intestazione mese */}
            <div
              style={{
                backgroundColor: "#f0f0f0",
                padding: "4px 8px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {giorni[0].toLocaleString("it-IT", { month: "long" })}
            </div>

            {/* Intestazione giorni */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${giorni.length}, 1fr)`,
                borderBottom: "1px solid #ccc",
              }}
            >
              {giorni.map((day) => (
                <div
                  key={day.toISOString()}
                  style={{
                    borderRight: "1px solid #ddd",
                    padding: "2px 4px",
                    textAlign: "center",
                    backgroundColor:
                      day.getDay() === 0 || day.getDay() === 6
                        ? "#fdecea"
                        : "#fff",
                  }}
                >
                  {day.getDate()}
                </div>
              ))}
            </div>

            {/* Corpo commesse: per ogni commessa, una riga con subgriglia dei giorni */}
            {dummyCommesse.map((commessa) => (
              <div
                key={commessa.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${giorni.length}, 1fr)`,
                  borderTop: "1px solid #eee",
                  minHeight: 24,
                }}
              >
                {giorni.map((day) => {
                  const attività = commessa.attività.find(
                    (att) => att.data === day.toISOString().slice(0, 10)
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      style={{
                        borderRight: "1px solid #eee",
                        backgroundColor: attività ? "#8dd3c7" : "transparent",
                        cursor: attività ? "pointer" : "default",
                        fontSize: 10,
                        padding: "2px 4px",
                      }}
                      title={attività ? attività.descrizione : ""}
                    >
                      {attività ? "●" : ""}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Nomi commesse sotto */}
            <div
              style={{
                borderTop: "1px solid #ccc",
                marginTop: 8,
                fontSize: 11,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Commesse: {dummyCommesse.map((c) => c.nome).join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GanttCustom;
