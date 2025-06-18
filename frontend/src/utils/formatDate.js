export const formatDate = (dateStr) => {
  const formatted = new Date(dateStr).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Rendi maiuscola la prima lettera
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
