const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validarFechaReserva,
  validarHoraReserva,
  validarCantidadPersonas
} = require("../../src/validators/reserva");

test("acepta fechas en lenguaje natural y numéricas", () => {
  for (const f of ["mañana", "sábado", "25/04", "25 de abril", "pasado mañana"]) {
    assert.equal(validarFechaReserva(f).valido, true, f);
  }
});

test("rechaza fechas que no entiende", () => {
  assert.equal(validarFechaReserva("cuando pueda").valido, false);
  assert.equal(validarFechaReserva("???").valido, false);
});

test("valida horas en formato 12h y 24h", () => {
  for (const h of ["7 pm", "8:30 pm", "19:00", "7"]) {
    assert.equal(validarHoraReserva(h).valido, true, h);
  }
  for (const h of ["25:00", "13 pm", "a las siete"]) {
    assert.equal(validarHoraReserva(h).valido, false, h);
  }
});

test("la cantidad de personas debe estar entre 1 y 40", () => {
  assert.deepEqual(validarCantidadPersonas("4"), { valido: true, valorNormalizado: 4 });
  assert.equal(validarCantidadPersonas("0").valido, false);
  assert.equal(validarCantidadPersonas("41").valido, false);
  assert.equal(validarCantidadPersonas("muchos").valido, false);
});
