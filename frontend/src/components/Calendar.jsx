import React, { useEffect, useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import itLocale from "@fullcalendar/core/locales/it";
import api from "../utils/api";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Ora openEventIds è un array di ID degli eventi attivi (o vuoto)
  const [openEventIds, setOpenEventIds] = useState([]);
  // Memorizziamo la data selezionata per mostrare solo eventi di quel giorno
  const [selectedDate, setSelectedDate] = useState(null);

  const dropdownRef = useRef(null);

  dayjs.extend(isSameOrAfter);
  dayjs.extend(isSameOrBefore);

  // Chiude il dropdown se clicco fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.classList.contains("fc-daygrid-day")
      ) {
        setOpenEventIds([]);
        setSelectedDate(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchCommesse = useCallback(async () => {
    try {
      const res = await api.get("/commesse");
      const commesse = res.data;

      const calendarEvents = commesse.map((commessa) => {
        const start = commessa.startDate
          ? new Date(commessa.startDate)
          : new Date();
        const end = commessa.endDate ? new Date(commessa.endDate) : new Date();
        // FullCalendar include end come esclusivo, quindi aggiungo 1 giorno se end > start
        const adjustedEnd =
          end && start && dayjs(end).isAfter(dayjs(start))
            ? dayjs(end).add(1, "day").toDate()
            : end;

        return {
          id: commessa._id,
          title: commessa.name || "Comessa senza nome",
          start,
          end: adjustedEnd,
          extendedProps: {
            machines: commessa.machines || [],
            activities: commessa.activities || [],
            workers: commessa.workers || [],
            location: commessa.location || "",
          },
        };
      });

      setEvents(calendarEvents);
      setLoading(false);
    } catch (error) {
      console.error("Errore caricamento commesse:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommesse();

    const socket = io(SOCKET_URL);
    socket.on("new_commessa", fetchCommesse);
    socket.on("update_commessa", fetchCommesse);

    return () => {
      socket.off("new_commessa", fetchCommesse);
      socket.off("update_commessa", fetchCommesse);
      socket.disconnect();
    };
  }, [fetchCommesse]);

  // Gestione click su data: mostra gli eventi di quel giorno o chiude dropdown
  const handleDateClick = (arg) => {
    const clickedDate = dayjs(arg.date).startOf("day");

    // Trova eventi attivi in quella data
    const eventiInData = events.filter((event) => {
      const start = dayjs(event.start).startOf("day");
      const end = dayjs(event.end).subtract(1, "day").startOf("day"); // perché end è esclusivo
      return (
        clickedDate.isSameOrAfter(start) && clickedDate.isSameOrBefore(end)
      );
    });

    if (eventiInData.length > 0) {
      setOpenEventIds(eventiInData.map((e) => e.id));
      setSelectedDate(clickedDate.format("YYYY-MM-DD"));
    } else {
      setOpenEventIds([]);
      setSelectedDate(null);
    }
  };

  // Costruzione set di date occupate per evidenziare le celle
  const occupiedDates = new Set();
  events.forEach((event) => {
    let current = dayjs(event.start);
    const end = dayjs(event.end).subtract(1, "day");
    while (current.isBefore(end) || current.isSame(end, "day")) {
      occupiedDates.add(current.format("YYYY-MM-DD"));
      current = current.add(1, "day");
    }
  });

  // Classi personalizzate per i giorni occupati
  function dayCellClassNames(arg) {
    const dateStr = dayjs(arg.date).format("YYYY-MM-DD");
    if (occupiedDates.has(dateStr)) {
      return ["occupied-day"];
    }
    return [];
  }

  if (loading) return <p>Caricamento commesse...</p>;

  return (
    <div className="calendar-wrapper" style={{ position: "relative" }}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
        initialView="multiMonthYear"
        views={{
          multiMonthYear: {
            type: "multiMonth",
            duration: { months: 3 },
            multiMonthMaxColumns: 3,
          },
        }}
        locale={itLocale}
        headerToolbar={{
          left: "prev,next",
          center: "",
          right: "",
        }}
        initialDate={dayjs().format("YYYY-MM-DD")}
        events={events}
        dayMaxEvents={false}
        height="auto"
        dayCellClassNames={dayCellClassNames}
        dateClick={handleDateClick}
        dayCellDidMount={(arg) => {
          const dateStr = dayjs(arg.date).format("YYYY-MM-DD");
          if (occupiedDates.has(dateStr)) {
            arg.el.style.cursor = "pointer";
            // Aggiungo l'event listener alla cella per fallback
            arg.el.addEventListener("click", () =>
              handleDateClick({ date: arg.date })
            );
          }
        }}
      />

      {openEventIds.length > 0 && (
        <div
          className="event-dropdown"
          ref={dropdownRef}
          style={{
            maxWidth: 600,
            margin: "12px auto",
            position: "absolute",
            top: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 12,
            zIndex: 10,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: 8 }}>
            Eventi del {selectedDate}
          </h2>
          <div className="position">
            {openEventIds.map((id) => {
              const event = events.find((e) => e.id === id);
              if (!event) return null;
              return (
                <div key={id}>
                  <h3 id="h3">{event.title}</h3>
                  <p>
                    <strong>Operai:</strong>{" "}
                    {event.extendedProps.workers.length > 0
                      ? event.extendedProps.workers.join(", ")
                      : "Nessuno"}
                  </p>
                  <p>
                    <strong>Macchine:</strong>{" "}
                    {event.extendedProps.machines.length > 0
                      ? event.extendedProps.machines.join(", ")
                      : "Nessuna"}
                  </p>
                  <p>
                    <strong>Attività:</strong>{" "}
                    {event.extendedProps.activities.length > 0
                      ? event.extendedProps.activities.join(", ")
                      : "Nessuna"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ height: "100px" }}></div>
    </div>
  );
}
