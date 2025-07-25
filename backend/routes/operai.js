const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// ✅ GET tutti gli operai
router.get("/", async (req, res) => {
  try {
    const lista = await prisma.operaio.findMany();
    res.status(200).json(lista);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero" });
  }
});

// ✅ POST nuovo operaio
router.post("/", async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome richiesto" });

  try {
    const esistente = await prisma.operaio.findUnique({ where: { nome } });
    if (esistente) return res.status(409).json({ error: "Già esistente" });

    const nuovo = await prisma.operaio.create({
      data: { nome },
    });

    res.status(201).json(nuovo);
  } catch (err) {
    res.status(500).json({ error: "Errore nella creazione" });
  }
});

// ✅ PUT modifica operaio
router.put("/:id", async (req, res) => {
  try {
    const aggiornato = await prisma.operaio.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.status(200).json(aggiornato);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Non trovato" });
    }
    res.status(500).json({ error: "Errore aggiornamento" });
  }
});

// ✅ DELETE operaio
router.delete("/:id", async (req, res) => {
  try {
    await prisma.operaio.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(200).json({ message: "Eliminato" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Non trovato" });
    }
    res.status(500).json({ error: "Errore eliminazione" });
  }
});

module.exports = router;
