import React, { useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import dayjs from "dayjs";
import io from "socket.io-client";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function GanttChart() {
  const [tasks, setTasks] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommessaId, setSelectedCommessaId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false); // inizialmente chiuso

  const buildTasks = (commesse) => {
    const ganttTasks = [];

    commesse.forEach((commessa) => {
      const activities = commessa.activities || [];
      const name = commessa.name?.trim() || "Commessa senza nome";

      if (activities.length === 0) {
        const startDate = dayjs(commessa.startDate || new Date());
        const endDate = dayjs(commessa.endDate || startDate.add(1, "day"));
        ganttTasks.push({
          id: `commessa-${commessa._id}`,
          name,
          start: startDate.toDate(),
          end: endDate.toDate(),
          type: "project",
          progress: 100,
          isDisabled: true,
          hideChildren: true,
          styles: { progressColor: "#3f51b5", progressSelectedColor: "#303f9f" },
        });
      } else {
        let minStart = dayjs(activities[0].startDate || commessa.startDate || new Date());
        let maxEnd = dayjs(activities[0].endDate || commessa.endDate || minStart.add(1, "day"));

        activities.forEach((att) => {
          const attStart = dayjs(att.startDate || minStart);
          const attEnd = dayjs(att.endDate || attStart.add(1, "day"));
          if (attStart.isBefore(minStart)) minStart = attStart;
          if (attEnd.isAfter(maxEnd)) maxEnd = attEnd;
        });

        ganttTasks.push({
          id: `commessa-${commessa._id}`,
          name,
          start: minStart.toDate(),
          end: maxEnd.toDate(),
          type: "project",
          progress: 100,
          isDisabled: true,
          styles: { progressColor: "#3f51b5", progressSelectedColor: "#303f9f" },
          hideChildren: false,
        });

        activities.forEach((att, idx) => {
          const attStart = dayjs(att.startDate || minStart);
          const attEnd = dayjs(att.endDate || attStart.add(1, "day"));
          ganttTasks.push({
            id: `att-${commessa._id}-${idx}`,
            name: att.name || `Attività ${idx + 1}`,
            start: attStart.toDate(),
            end: attEnd.toDate(),
            type: "task",
            progress: att.progress || 0,
            project: `commessa-${commessa._id}`,
            styles: { progressColor: "#2196f3", progressSelectedColor: "#1976d2" },
          });
        });
      }
    });

    return ganttTasks;
  };

  const getQuarterStart = () => {
    const now = dayjs();
    const quarterStartMonth = Math.floor(now.month() / 3) * 3;
    return now.month(quarterStartMonth).startOf("month");
  };

  const fetchCommesse = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/commesse");
      const commesseData = res.data;
      setCommesse(commesseData);

      const newTasks = buildTasks(commesseData);
      setTasks(newTasks);
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

  if (loading) return <p style={{ textAlign: "center", marginTop: 50, fontSize: 18 }}>Caricamento commesse e attività...</p>;

  const togglePanel = () => setPanelOpen((open) => !open);

  const renderActivitiesTree = (commessa) => {
    if (!commessa.activities || commessa.activities.length === 0) {
      return <p style={{ marginLeft: 20, fontStyle: "italic", color: "#666" }}>Nessuna attività registrata</p>;
    }
    return (
      <ul style={{ marginLeft: 20, listStyleType: "none", paddingLeft: 0 }}>
        {commessa.activities.map((att, i) => (
          <li
            key={i}
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 6,
              backgroundColor: "#e3f2fd",
              boxShadow: "inset 0 0 5px #bbdefb",
            }}
          >
            <strong style={{ color: "#0d47a1" }}>{att.name}</strong> <br />
            <small style={{ color: "#555" }}>
              Inizio: {dayjs(att.startDate).format("DD/MM/YYYY")} - Fine: {dayjs(att.endDate).format("DD/MM/YYYY")}
              <br />
              Progresso: {att.progress ?? 0}%
            </small>
          </li>
        ))}
      </ul>
    );
  };

  const ganttHeight = window.innerHeight - 140;
  const quarterStart = getQuarterStart();
  const quarterEnd = quarterStart.add(3, "month").subtract(1, "day");

  // Gestione click barra Gantt: apre/chiude aside e seleziona commessa
  const onSelectTask = (task) => {
    // Solo se è una commessa (id inizia con "commessa-")
    if (task.id.startsWith("commessa-")) {
      const commessaId = task.id.replace("commessa-", "");
      if (selectedCommessaId === commessaId) {
        // Se stessa commessa cliccata, chiudo pannello e deseleziono
        setSelectedCommessaId(null);
        setPanelOpen(false);
      } else {
        // Se diversa, apro pannello e seleziono commessa
        setSelectedCommessaId(commessaId);
        setPanelOpen(true);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        backgroundColor: "#f5f7fa",
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#222",
      }}
    >
      <aside
        style={{
          width: panelOpen ? 320 : 0,
          transition: "width 0.3s ease",
          backgroundColor: "#fff",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          overflowY: "auto",
          height: "100%",
          flexShrink: 0,
          minWidth: panelOpen ? 280 : 0,
          maxWidth: panelOpen ? 320 : 0,
          borderRight: "1px solid #ddd",
          userSelect: "none",
        }}
      >
        <button
          onClick={togglePanel}
          style={{
            margin: 12,
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "#3f51b5",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: "600",
            fontSize: 14,
            boxShadow: "0 2px 6px rgba(63,81,181,0.4)",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#303f9f")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3f51b5")}
        >
          {panelOpen ? "← Chiudi" : "→ Apri"}
        </button>

        {panelOpen && (
          <>
            <h3
              style={{
                paddingLeft: 20,
                fontWeight: "700",
                fontSize: 20,
                color: "#3f51b5",
                marginBottom: 12,
                borderBottom: "2px solid #3f51b5",
                userSelect: "none",
              }}
            >
              Commesse Registrate
            </h3>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
              {commesse.map((commessa) => (
                <li
                  key={commessa._id}
                  style={{
                    borderBottom: "1px solid #eee",
                    transition: "background-color 0.3s ease",
                    backgroundColor: selectedCommessaId === commessa._id ? "#e8eaf6" : "transparent",
                    userSelect: "none",
                  }}
                >
                  <button
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      display: "block",
                      width: "100%",
                      padding: "14px 20px",
                      textAlign: "left",
                      fontWeight: selectedCommessaId === commessa._id ? "700" : "500",
                      color: selectedCommessaId === commessa._id ? "#1a237e" : "#3a3a3a",
                      borderLeft: selectedCommessaId === commessa._id ? "4px solid #3f51b5" : "4px solid transparent",
                      transition: "background-color 0.2s ease, border-left-color 0.2s ease",
                      fontSize: 15,
                      userSelect: "none",
                    }}
                    onClick={() => {
                      if (selectedCommessaId === commessa._id) {
                        setSelectedCommessaId(null);
                        setPanelOpen(false);
                      } else {
                        setSelectedCommessaId(commessa._id);
                        setPanelOpen(true);
                      }
                    }}
                  >
                    {commessa.name?.trim() || "Commessa senza nome"}
                  </button>

                  {selectedCommessaId === commessa._id && (
                    <div style={{ marginBottom: 16, paddingLeft: 12 }}>{renderActivitiesTree(commessa)}</div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>

      <main
        style={{
          flexGrow: 1,
          overflowX: "auto",
          backgroundColor: "#fafafa",
          padding: "12px 18px 24px",
          borderLeft: "1px solid #ddd",
          userSelect: "none",
        }}
      >
        <h2
          style={{
            fontWeight: "700",
            fontSize: 24,
            color: "#3f51b5",
            marginBottom: 18,
            userSelect: "none",
          }}
        >
          Calendario Attività Commesse (Prossimo Trimestre)
        </h2>

        <div
          style={{
            height: ganttHeight,
            backgroundColor: "#fff",
            borderRadius: 8,
            boxShadow: "0 0 15px rgb(0 0 0 / 0.1)",
            userSelect: "none",
          }}
        >
          <Gantt
            tasks={tasks}
            viewMode={ViewMode.Month}
            onSelect={onSelectTask}
            barCornerRadius={5}
            columnWidth={72}
            locale={"it-IT"}
            dateStart={quarterStart.toDate()}
            dateEnd={quarterEnd.toDate()}
            onExpanderClick={() => {}}
            listCellWidth="270px"
            onDoubleClick={() => {}}
          />
        </div>
      </main>
    </div>
  );
}
