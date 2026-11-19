// Prueba de integración: registra una reserva en SQLite y la vuelve a leer.
// Solo corre en el pipeline (variable CI), para no tocar la base de datos real.
const test = require("node:test");
const assert = require("node:assert/strict");

test("procesarReserva guarda la reserva en la base de datos", { skip: !process.env.CI && "solo en CI" }, () => {
  const { db } = require("../../src/db/database");
  const { procesarReserva } = require("../../src/services/procesarReserva");

  const r = procesarReserva({
    telefono: "573001234567",
    jid: "573001234567@s.whatsapp.net",
    data: {
      nombre: "Prueba CI", zona: "Terraza", fecha_iso: "2026-11-21",
      hora: "7 pm", personas: 4, celular: "3001234567"
    }
  });

  const id = Number(r.notificarAdmin.texto.match(/Nueva reserva #(\d+)/)[1]);
  const fila = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id);

  assert.equal(fila.nombre, "Prueba CI");
  assert.equal(fila.personas, 4);
  assert.equal(fila.estado, "pendiente");
  assert.match(r.textoCliente, /registrada correctamente/);
});
