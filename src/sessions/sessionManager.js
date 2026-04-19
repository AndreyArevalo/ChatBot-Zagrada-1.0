const sesiones = new Map();

// Registro independiente de "saludados" para que sobreviva a resetSesion.
// clave: telefono | valor: timestamp (ms) del ultimo saludo.
const saludados = new Map();

// Ventana en la que se considera que el cliente YA fue saludado
// y no se le vuelve a saludar aunque reinicie su sesion.
const VENTANA_SALUDO_MS = 20 * 60 * 1000; // 20 minutos

function obtenerSesion(telefono) {
  if (!sesiones.has(telefono)) {
    sesiones.set(telefono, {
      paso: "inicio",
      data: {}
    });
  }

  return sesiones.get(telefono);
}

function actualizarSesion(telefono, cambios) {
  const sesionActual = obtenerSesion(telefono);

  const nuevaSesion = {
    ...sesionActual,
    ...cambios,
    data: {
      ...(sesionActual.data || {}),
      ...((cambios && cambios.data) || {})
    }
  };

  sesiones.set(telefono, nuevaSesion);
  return nuevaSesion;
}

function resetSesion(telefono) {
  sesiones.set(telefono, {
    paso: "inicio",
    data: {}
  });
}

function eliminarSesion(telefono) {
  sesiones.delete(telefono);
}

// --- Saludo persistente ---

function yaFueSaludado(telefono) {
  const ts = saludados.get(telefono);
  if (!ts) return false;
  const ahora = Date.now();
  if (ahora - ts > VENTANA_SALUDO_MS) {
    saludados.delete(telefono);
    return false;
  }
  return true;
}

function marcarSaludado(telefono) {
  saludados.set(telefono, Date.now());
}

function limpiarSaludo(telefono) {
  saludados.delete(telefono);
}

module.exports = {
  obtenerSesion,
  actualizarSesion,
  resetSesion,
  eliminarSesion,
  yaFueSaludado,
  marcarSaludado,
  limpiarSaludo
};
