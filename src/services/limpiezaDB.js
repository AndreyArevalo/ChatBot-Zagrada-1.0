const db = require("../db/database");

function limpiarRegistrosVencidos() {
  try {
    const hoy = new Date().toISOString().slice(0, 10);

    const reservas = db.prepare(`
      DELETE FROM reservas
      WHERE fecha IS NOT NULL
        AND fecha < ?
    `).run(hoy);

    const domicilios = db.prepare(`
      DELETE FROM domicilios
      WHERE fecha_servicio IS NOT NULL
        AND fecha_servicio < ?
    `).run(hoy);

    console.log(
      `[LIMPIEZA] Reservas eliminadas: ${reservas.changes} | Domicilios eliminados: ${domicilios.changes}`
    );
  } catch (error) {
    console.error("Error limpiando registros vencidos:", error.message);
  }
}

function iniciarLimpiezaAutomatica() {
  limpiarRegistrosVencidos();

  const unaHora = 60 * 60 * 1000;
  setInterval(() => {
    limpiarRegistrosVencidos();
  }, unaHora);
}

module.exports = {
  limpiarRegistrosVencidos,
  iniciarLimpiezaAutomatica
};