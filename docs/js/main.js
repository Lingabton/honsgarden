// Hönsguiden — minimal JS.
// Den här filen ska helst stanna kort. Sidan ska fungera utan JS.

// Auto-uppdatera "Senast uppdaterad" om man taggar element med data-updated="auto"
document.querySelectorAll('[data-updated="auto"]').forEach((el) => {
  const d = new Date();
  const months = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
  el.textContent = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
});
