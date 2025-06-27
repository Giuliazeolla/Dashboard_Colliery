export function validateJobForm(selected) {
  const { title, worker, machine, activity, location, startDate, endDate } = selected;

  if (!title.trim() || !worker.length || !machine.length || !activity.length || !location.trim() || !startDate || !endDate) {
    return "Tutti i campi sono obbligatori.";
  }

  if (new Date(startDate) > new Date(endDate)) {
    return "La data di fine non può essere precedente a quella di inizio.";
  }

  return null;
}
