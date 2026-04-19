const overrides = new Map();
const autoSends = [];

function normalizarTelefono(jid) {
  if (!jid) return "";

  return String(jid)
    .split(":")[0]
    .replace("@s.whatsapp.net", "")
    .replace("@lid", "")
    .trim();
}

function registrarAutoSend(jid, payload) {
  const texto =
    payload?.text ||
    payload?.caption ||
    payload?.fileName ||
    "";

  autoSends.push({
    telefono: normalizarTelefono(jid),
    texto: String(texto || "").trim().toLowerCase(),
    createdAt: Date.now()
  });

  limpiarAutoSends();
}

function fueAutoSendReciente(jid, mensajeTexto = "") {
  limpiarAutoSends();

  const telefono = normalizarTelefono(jid);
  const texto = String(mensajeTexto || "").trim().toLowerCase();

  return autoSends.some((item) => {
    return item.telefono === telefono && (!texto || item.texto === texto);
  });
}

function activarHumanoTemporal(telefono, minutos = 20) {
  overrides.set(telefono, Date.now() + minutos * 60 * 1000);
}

function estaEnHumanoTemporal(telefono) {
  const hasta = overrides.get(telefono);
  if (!hasta) return false;

  if (Date.now() > hasta) {
    overrides.delete(telefono);
    return false;
  }

  return true;
}

function limpiarAutoSends() {
  const ahora = Date.now();
  while (autoSends.length && ahora - autoSends[0].createdAt > 15000) {
    autoSends.shift();
  }
}

module.exports = {
  registrarAutoSend,
  fueAutoSendReciente,
  activarHumanoTemporal,
  estaEnHumanoTemporal
};