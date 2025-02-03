export const formatDate = (dateString) => {
    if (!dateString) return ""; 
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // In case of invalid date
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  