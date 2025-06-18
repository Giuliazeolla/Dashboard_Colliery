import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import JobForm from "./JobForm";
import Spinner from "./Spinner";

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workers, setWorkers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState({
    title: "",
    worker: [],
    machine: [],
    activity: [],
    location: "",
    startDate: "",
    endDate: "",
  });
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const fetchJobData = async (id) => {
    try {
      const res = await api.get(`/jobs/${id}`);
      const job = res.data;
      setSelected({
        id: job._id || job.id,
        title: job.title || "",
        worker: Array.isArray(job.workers)
          ? job.workers.map((w) => ({ value: w._id, label: w.name }))
          : [],
        machine: Array.isArray(job.machines)
          ? job.machines.map((m) => ({ value: m._id, label: m.name }))
          : [],
        activity: Array.isArray(job.activities)
          ? job.activities.map((a) => ({ value: a._id, label: a.description }))
          : [],
        location: job.location || "",
        startDate: job.startDate ? job.startDate.split("T")[0] : "",
        endDate: job.endDate ? job.endDate.split("T")[0] : "",
      });
    } catch (err) {
      console.error("Errore caricamento job:", err);
      alert("Errore caricamento dati job");
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get("/workers");
      setWorkers(res.data.map(w => ({ value: w._id, label: w.name })));
    } catch (err) {
      console.error("Errore caricamento workers:", err);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await api.get("/machines");
      setMachines(res.data.map(m => ({ value: m._id, label: m.name })));
    } catch (err) {
      console.error("Errore caricamento machines:", err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get("/activities");
      setActivities(res.data.map(a => ({ value: a._id, label: a.description })));
    } catch (err) {
      console.error("Errore caricamento activities:", err);
    }
  };

  useEffect(() => {
    setLoadingData(true);
    Promise.all([fetchWorkers(), fetchMachines(), fetchActivities()])
      .then(() => fetchJobData(id))
      .finally(() => setLoadingData(false));
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setSelected((prev) => ({ ...prev, [name]: value }));
  };

  const onMultiSelectChange = (name, selectedOptions) => {
    setSelected((prev) => ({
      ...prev,
      [name]: selectedOptions || [],
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Preparare i dati da inviare
    const jobData = {
      title: selected.title,
      workers: selected.worker.map((w) => w.value),
      machines: selected.machine.map((m) => m.value),
      activities: selected.activity.map((a) => a.value),
      location: selected.location,
      startDate: selected.startDate || null,
      endDate: selected.endDate || null,
    };

    setLoadingSave(true);
    try {
      await api.put(`/jobs/${id}`, jobData);
      alert("Commessa aggiornata con successo!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Errore aggiornamento job:", error);
      alert("Errore aggiornamento job");
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Sei sicuro di voler eliminare la commessa?');
    if (!confirmed) return ;

    try {
      await api.delete(`/jobs/${selected.id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error("Errore durante l'eliminazione", error);
    alert("Errore nell'eliminazione della commessa.");
    }
  }


  if (loadingData) return <Spinner />;

  return (
    <div className="edit-job">
      <JobForm
        workers={workers}
        machines={machines}
        activities={activities}
        selected={selected}
        onChange={onChange}
        onMultiSelectChange={onMultiSelectChange}
        onSubmit={onSubmit}
        onDelete={handleDelete}
        loadingSave={loadingSave}
        submitText="Aggiorna Commessa"
        isEditing={true}
      />
    </div>
  );
}
