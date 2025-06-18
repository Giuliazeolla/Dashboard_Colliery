import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import JobForm from "./JobForm";

const getDefaultDate = () => new Date().toISOString().split("T")[0];

export default function CreateJobEmpty() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const defaultDate = params.get("date") || getDefaultDate();

  const [workers, setWorkers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [machines, setMachines] = useState([]);

  const [selected, setSelected] = useState({
    title: "",
    worker: [],    // deve essere sempre array di oggetti {value,label}
    machine: [],
    activity: [],
    location: "",
    startDate: defaultDate,
    endDate: defaultDate,
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [w, m, a] = await Promise.all([
          api.get("/workers"),
          api.get("/machines"),
          api.get("/activities"),
        ]);
        console.log("Activities:", a.data);
        setWorkers(
          w.data.map((w) => ({
            value: w._id,
            label: w.name,
          }))
        );
        setMachines(
          m.data.map((m) => ({
            value: m._id,
            label: m.name,
          }))
        );
        setActivities(
          a.data.map((a) => ({
            value: a._id,
            label: a.description,
          }))
        );
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        alert("Errore nel caricamento. Riprova.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const prepareSaveData = () => {
    return {
      title: selected.title.trim(),
      // estrai solo i valori (id) da ogni array di oggetti
      workers: selected.worker.map((w) => (typeof w === "object" ? w.value : w)),
      machines: selected.machine.map((m) => (typeof m === "object" ? m.value : m)),
      activities: selected.activity.map((a) => (typeof a === "object" ? a.value : a)),
      location: selected.location.trim(),
      startDate: selected.startDate,
      endDate: selected.endDate,
    };
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Devi effettuare il login prima.");
      return;
    }

    const { title, worker, machine, activity, location, startDate, endDate } = selected;

    if (
      !title.trim() ||
      worker.length === 0 ||
      machine.length === 0 ||
      activity.length === 0 ||
      !location.trim() ||
      !startDate ||
      !endDate
    ) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("La data di fine non può essere precedente a quella di inizio.");
      return;
    }

    const payload = prepareSaveData();
    console.log("Dati inviati:", payload);

    setLoading(true);
    try {
      await api.post("/jobs", payload);
      alert("Commessa salvata con successo.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      const errMsg =
        error?.response?.data?.message || "Errore durante il salvataggio. Riprova.";
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <p>Caricamento dati commessa...</p>;

  return (
    <JobForm
      selected={selected}
      setSelected={setSelected}
      workers={workers}
      machines={machines}
      activities={activities}
      loading={loading}
      onSave={handleSave}
      onChange={(e) => {
        // Per input normali (text, date)
        setSelected({
          ...selected,
          [e.target.name]: e.target.value,
        });
      }}
      onMultiSelectChange={(field, values) => {
        // values è un array di oggetti {value,label} o null
        setSelected({
          ...selected,
          [field]: values || [],
        });
      }}
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      isEditing={false}
    />
  );
}
