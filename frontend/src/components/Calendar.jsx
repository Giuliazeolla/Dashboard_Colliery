import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import itLocale from "@fullcalendar/core/locales/it";
import api from "../utils/api";
import dayjs from "dayjs";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Calendar({ onDateSelect }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get("/jobs");
      const formatted = res.data.map((job) => {
        const start = job.startDate ? new Date(job.startDate) : null;
        const end = job.endDate ? new Date(job.endDate) : null;
        let calendarEnd = null;
        if (end && dayjs(end).isAfter(dayjs(start))) {
          calendarEnd = dayjs(end).add(1, "day").toDate();
        }

        return {
          id: job._id,
          title: job.title,
          start,
          end: calendarEnd,
          extendedProps: {
            activity: job.activity,
            location: job.location,
            worker: job.worker,
            machine: job.machine,
          },
        };
      });
      setEvents(formatted);
      setLoading(false);
    } catch (err) {
      console.error("Errore nel caricamento delle attività", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const socket = io(SOCKET_URL);
    socket.on("jobsUpdated", fetchJobs);
    return () => {
      socket.off("jobsUpdated", fetchJobs);
      socket.disconnect();
    };
  }, [fetchJobs]);

  const handleEventDrop = async ({ event }) => {
    try {
      const id = event.id;
      const newStart = event.start;
      const newEnd = event.end
        ? dayjs(event.end).subtract(1, "day").toDate()
        : newStart;

      const { activity, location, worker, machine } = event.extendedProps;

      await api.put(`/jobs/${id}`, {
        activity,
        location,
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
        worker,
        machine,
      });
    } catch (err) {
      console.error("Errore aggiornamento job", err);
      alert("Errore nell'aggiornamento dell'attività");
    }
  };

  const handleEventClick = ({ event }) => {
    navigate(`/jobs/edit/${event.id}`);
  };

  const handleDateClick = (info) => {
    if (onDateSelect) {
      onDateSelect(info.dateStr);
    }
    navigate(`/jobs/create?date=${info.dateStr}`);
  };

  if (loading) return <p>Caricamento...</p>;

  return (
    <div className="calendar-compact-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={itLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        editable={true}
        height="auto"
        events={events}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        aspectRatio={1.5}
      />
    </div>
  );
}
