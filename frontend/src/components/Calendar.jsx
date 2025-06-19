import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import itLocale from "@fullcalendar/core/locales/it";
import api from "../utils/api"; // Assumi che api sia configurato con la base URL del backend
import dayjs from "dayjs";
import "dayjs/locale/it";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Funzione per caricare le commesse da backend
  const fetchCommesse = useCallback(async () => {
    try {
      const res = await api.get("/commesse"); // endpoint per tutte le commesse
      const commesse = res.data;

      // Mappa commesse in eventi per FullCalendar
      const calendarEvents = commesse.map((commessa) => {
        const start = commessa.startDate ? new Date(commessa.startDate) : null;
        const end = commessa.endDate ? new Date(commessa.endDate) : null;
        // FullCalendar considera l'end esclusivo, quindi aggiungiamo 1 giorno
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
    socket.on("commesseUpdated", fetchCommesse); // aggiorna calendario in realtime se backend manda evento

    return () => {
      socket.off("commesseUpdated", fetchCommesse);
      socket.disconnect();
    };
  }, [fetchCommesse]);

  // Cliccando su evento vai alla pagina di modifica commessa
  const handleEventClick = ({ event }) => {
    navigate(`/commesse/edit/${event.id}`);
  };

  // Cliccando su data crei nuova commessa con data precompilata
  const handleDateClick = (info) => {
    navigate(`/commesse/create?date=${info.dateStr}`);
  };

  const today = dayjs();
  dayjs.locale("it");

  if (loading) return <p>Caricamento commesse...</p>;

  return (
    <div className="calendar-wrapper">
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>
            Anno {today.year()}
            <br />
            {today.format("MMMM")} / {today.add(1, "month").format("MMMM")} /{" "}
            {today.add(2, "month").format("MMMM")}
          </h2>
        </div>
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
          initialDate={today.format("YYYY-MM-DD")}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="auto"
        />
      </div>
    </div>
  );
}
