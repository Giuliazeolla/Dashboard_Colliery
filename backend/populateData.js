const mongoose = require('mongoose');
require('dotenv').config();
const Worker = require('./models/Worker');
const Machine = require('./models/Machine');
const Activity = require('./models/Activity');

const MONGO_URI = process.env.MONGO_URI;  

// Dati di esempio per i workers
const workers = [
  { name: "Diego Barricelli" },
  { name: "Emanuele Sasso" },
  { name: "Andrea Dario Milazzo" },
  { name: "Francesco Sorice" },
  { name: "Anik Howlader" },
  { name: "Mufik Islam" },
  { name: "Luca" },
  { name: "Fausto Tufo" },
  { name: "Sow Moassa" },
  { name: "Giuseppe D'amato" }
];


// Dati di esempio per le machines
const machines = [
  { name: "Battipalo1" },
  { name: "Battipalo2" },
  { name: "Battipalo3" },
  { name: "Mangusta" },
  { name: "Bobcat" }
];

// Dati di esempio per le activities
const activities = [
  { description: "Progettazione esecutiva" },
  { description: "Pull-out Test" },
  { description: "Disegni Esecutivi" },
  { description: "Ordine ai fornitori" },
  { description: "Consegna Pali" },
  { description: "Infissione Pali" },
  { description: "Consegna Struttura" },
  { description: "Montaggio Struttura" },
  { description: "Montaggio Moduli" },
  { description: "Collaudo" }
];

async function populate() {
  try {
    await mongoose.connect(MONGO_URI);

    // Pulizia delle collezioni
    await Worker.deleteMany({});
    await Machine.deleteMany({});
    await Activity.deleteMany({});

    // Inserimento dati
    await Worker.insertMany(workers);
    await Machine.insertMany(machines);
    await Activity.insertMany(activities);

    console.log('Dati inseriti con successo!');
    process.exit(0);
  } catch (error) {
    console.error('Errore durante il popolamento:', error);
    process.exit(1);
  }
}

populate();
