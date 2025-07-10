const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = function(io) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    console.log('➡️ Richiesta ricevuta in /api/assegnazioni');

    try {
      const commesse = await prisma.commessa.findMany({
        include: {
          attivita: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      console.log('✅ Commesse trovate:', commesse.length);

      const assegnazioni = commesse.map(commessa => ({
        commessaId: commessa.id,
        nomeCommessa: commessa.nome,
        dataInizio: commessa.dataInizio,
        dataFine: commessa.dataFine,
        attivita: commessa.attivita.map(att => ({
          id: att.id,
          nome: att.nome,
        })),
      }));

      console.log('📤 Invio risposta JSON');

      // Emetto evento socket con i dati aggiornati
      io.emit('aggiornaAssegnazioni', assegnazioni);

      res.json(assegnazioni);

    } catch (err) {
      console.error('❌ Errore in /api/assegnazioni:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
