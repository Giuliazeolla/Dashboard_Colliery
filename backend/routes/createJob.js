const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Job = require("../models/Job");
const auth = require("../middleware/auth");

module.exports = function(io) {
  // Middleware per aggiungere io a req
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Crea un nuovo job
  router.post("/", auth, async (req, res) => {
    try {
      const { title, workers, machines, activities, startDate, endDate, location } = req.body;

      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Il titolo è obbligatorio e deve essere una stringa valida." });
      }

      if (!Array.isArray(workers) || workers.length === 0 || !workers.every(w => mongoose.Types.ObjectId.isValid(w))) {
        return res.status(400).json({ error: "La lista workers deve essere un array di ObjectId validi." });
      }

      if (!Array.isArray(machines) || machines.length === 0 || !machines.every(m => mongoose.Types.ObjectId.isValid(m))) {
        return res.status(400).json({ error: "La lista machines deve essere un array di ObjectId validi." });
      }

      if (!Array.isArray(activities) || activities.length === 0 || !activities.every(a => mongoose.Types.ObjectId.isValid(a))) {
        return res.status(400).json({ error: "La lista activities deve essere un array di ObjectId validi." });
      }

      if (startDate && isNaN(Date.parse(startDate))) {
        return res.status(400).json({ error: "La data di inizio non è valida." });
      }

      if (endDate && isNaN(Date.parse(endDate))) {
        return res.status(400).json({ error: "La data di fine non è valida." });
      }

      if (location && (typeof location !== "string" || !location.trim())) {
        return res.status(400).json({ error: "Il campo location deve essere una stringa valida." });
      }

      const job = new Job({
        title: title.trim(),
        workers,
        machines,
        activities,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        location: location ? location.trim() : undefined,
        createdBy: req.user._id,
      });

      await job.save();

      const populatedJob = await Job.findById(job._id)
        .populate("workers", "name")
        .populate("machines", "name")
        .populate("activities", "description")
        .exec();

      if (req.io) {
        req.io.emit("jobsUpdated");
      }

      res.status(201).json(populatedJob);
    } catch (error) {
      console.error("Errore nella creazione job:", error);
      res.status(500).json({ error: "Errore interno del server." });
    }
  });

  // Ottieni lista job
  router.get("/", auth, async (req, res) => {
    try {
      const jobs = await Job.find()
        .populate("workers", "name")
        .populate("machines", "name")
        .populate("activities", "description")
        .exec();

      res.json(jobs);
    } catch (error) {
      console.error("Errore nel recupero job:", error);
      res.status(500).json({ error: "Errore interno del server." });
    }
  });

  // Ottieni job singolo per id
  router.get("/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID job non valido." });
      }

      const job = await Job.findById(id)
        .populate("workers", "name")
        .populate("machines", "name")
        .populate("activities", "description")
        .exec();

      if (!job) {
        return res.status(404).json({ error: "Job non trovato." });
      }

      res.json(job);
    } catch (error) {
      console.error("Errore nel recupero job:", error);
      res.status(500).json({ error: "Errore interno del server." });
    }
  });

  // Aggiorna un job esistente
  router.put("/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID job non valido." });
      }

      const { title, workers, machines, activities, startDate, endDate, location } = req.body;

      const updateData = {};

      if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) {
          return res.status(400).json({ error: "Il titolo deve essere una stringa valida." });
        }
        updateData.title = title.trim();
      }

      if (workers !== undefined) {
        if (!Array.isArray(workers) || !workers.every(w => mongoose.Types.ObjectId.isValid(w))) {
          return res.status(400).json({ error: "La lista workers deve essere un array di ObjectId validi." });
        }
        updateData.workers = workers;
      }

      if (machines !== undefined) {
        if (!Array.isArray(machines) || !machines.every(m => mongoose.Types.ObjectId.isValid(m))) {
          return res.status(400).json({ error: "La lista machines deve essere un array di ObjectId validi." });
        }
        updateData.machines = machines;
      }

      if (activities !== undefined) {
        if (!Array.isArray(activities) || !activities.every(a => mongoose.Types.ObjectId.isValid(a))) {
          return res.status(400).json({ error: "La lista activities deve essere un array di ObjectId validi." });
        }
        updateData.activities = activities;
      }

      if (startDate !== undefined) {
        if (startDate && isNaN(Date.parse(startDate))) {
          return res.status(400).json({ error: "La data di inizio non è valida." });
        }
        updateData.startDate = startDate ? new Date(startDate) : null;
      }

      if (endDate !== undefined) {
        if (endDate && isNaN(Date.parse(endDate))) {
          return res.status(400).json({ error: "La data di fine non è valida." });
        }
        updateData.endDate = endDate ? new Date(endDate) : null;
      }

      if (location !== undefined) {
        if (location && (typeof location !== "string" || !location.trim())) {
          return res.status(400).json({ error: "Il campo location deve essere una stringa valida." });
        }
        updateData.location = location ? location.trim() : undefined;
      }

      const updatedJob = await Job.findByIdAndUpdate(id, updateData, { new: true })
        .populate("workers", "name")
        .populate("machines", "name")
        .populate("activities", "description")
        .exec();

      if (!updatedJob) {
        return res.status(404).json({ error: "Job non trovato." });
      }

      if (req.io) {
        req.io.emit("jobsUpdated");
      }

      res.json(updatedJob);
    } catch (error) {
      console.error("Errore nell'aggiornamento job:", error);
      res.status(500).json({ error: "Errore interno del server." });
    }
  });

  // Elimina un job
  router.delete("/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID job non valido." });
      }

      const deletedJob = await Job.findByIdAndDelete(id);

      if (!deletedJob) {
        return res.status(404).json({ error: "Job non trovato." });
      }

      if (req.io) {
        req.io.emit("jobsUpdated");
      }

      res.json({ message: "Job eliminato con successo." });
    } catch (error) {
      console.error("Errore nell'eliminazione job:", error);
      res.status(500).json({ error: "Errore interno del server." });
    }
  });

  return router;
}
