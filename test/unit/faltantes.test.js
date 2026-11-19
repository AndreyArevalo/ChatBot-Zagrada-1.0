const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calcularFaltantesReserva,
  calcularFaltantesDomicilio
} = require("../../src/services/faltantes");

test("una reserva vacía pide todos los datos", () => {
  assert.deepEqual(calcularFaltantesReserva({}), [
    "zona", "fecha", "hora", "personas", "nombre", "celular"
  ]);
});

test("una reserva completa no tiene faltantes", () => {
  const reserva = {
    zona: "Terraza", fecha_iso: "2026-11-21", hora: "7 pm",
    personas: 4, nombre: "Laura", celular: "3001234567"
  };
  assert.deepEqual(calcularFaltantesReserva(reserva), []);
});

test("un domicilio sin productos pide el pedido", () => {
  const faltantes = calcularFaltantesDomicilio({
    nombre: "Carlos", contacto: "3001234567", direccion: "Calle 10 # 5-20",
    formaPago: "efectivo", pedidoItems: []
  });
  assert.deepEqual(faltantes, ["pedidoItems"]);
});
