const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Attivita = require('./models/Attività');
const Operaio = require('./models/Operaio');
const Mezzo = require('./models/Mezzo');
const Attrezzo = require('./models/Attrezzo');

const seed = async () => {
    try {
        await Attivita.deleteMany();
        await Operaio.deleteMany();
        await Mezzo.deleteMany();
        await Attrezzo.deleteMany();

        await Attivita.insertMany([
            { nome: 'Progettazione Preliminare', origine: 'statico' },
            { nome: 'Pull-out Test', origine: 'statico' },
            { nome: 'Progettazione Esecutiva', origine: 'statico' },
            { nome: 'Esecutivi di Officina', origine: 'statico' },
            { nome: 'Ordine Fornitore', origine: 'statico' },
            { nome: 'Consegna Pali', origine: 'statico' },
            { nome: 'Infissione Pali', origine: 'statico' },
            { nome: 'Consegna Struttura', origine: 'statico' },
            { nome: 'Montaggio Struttura', origine: 'statico' },
            { nome: 'Montaggio Moduli', origine: 'statico' },
            { nome: 'Collaudo', origine: 'statico' },
        ]);

        await Operaio.insertMany([
            { nome: 'Emanuele Sasso', origine: 'statico' },
            { nome: 'Diego Barricelli', origine: 'statico' },
            { nome: 'Andrea Dario Milazzo', origine: 'statico' },
            { nome: 'Anik Howlader', origine: 'statico' },
            { nome: 'Francesco Sorice', origine: 'statico' },
            { nome: 'Mufik Islam', origine: 'statico' },
            { nome: "Giuseppe D'Amato", origine: 'statico' },
            { nome: 'Sow Moussa', origine: 'statico' },
        ]);

        await Mezzo.insertMany([
            { nome: 'Battipalo_01', origine: 'statico' },
            { nome: 'Battipalo_02', origine: 'statico' },
            { nome: 'Battipalo_03', origine: 'statico' },
            { nome: 'Mangusta', origine: 'statico' },
            { nome: 'Bobcat', origine: 'statico' },
        ]);

        await Attrezzo.insertMany([
            { nome: 'Avvitatore_01', origine: 'statico' },
            { nome: 'Avvitatore_02', origine: 'statico' },
            { nome: 'Avvitatore_03', origine: 'statico' },
            { nome: 'Avvitatore Angolare_01', origine: 'statico' },
            { nome: 'Avvitatore Angolare_02', origine: 'statico' },
            { nome: 'Avvitatore Angolare_03', origine: 'statico' },
            { nome: 'Smerigliatrice_01', origine: 'statico' },
            { nome: 'Smerigliatrice_02', origine: 'statico' },
            { nome: 'Trapano_01', origine: 'statico' },
            { nome: 'Trapano_02', origine: 'statico' },
            { nome: 'Tasselatore', origine: 'statico' },
            { nome: 'Sega Circolare', origine: 'statico' }
        ]);

        console.log('Dati statici inseriti con successo!');
        process.exit();
    } catch (err) {
        console.error('Errore durante il seed:', err);
        process.exit(1);
    }
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestionale')
  .then(() => {
    console.log('MongoDB connesso');
    seed();
  })
  .catch(err => {
    console.error('Errore connessione MongoDB:', err);
  });
