const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parsearPedidoConMenu,
  normalizarTexto,
  detectarCategoriaGenerica
} = require("../../src/services/menuParser");

test("normaliza tildes, eñes y mayúsculas", () => {
  assert.equal(normalizarTexto("Árbol ÑOÑO  Café"), "arbol nono cafe");
});

test("un pedido vacío devuelve lista vacía", () => {
  assert.deepEqual(parsearPedidoConMenu(""), []);
});

test("toma la cantidad de cada producto", () => {
  const items = parsearPedidoConMenu("2 limonadas de coco");
  assert.equal(items[0].cantidad, 2);
});

test("si piden 'una hamburguesa' sin especificar, pregunta cuál", () => {
  const r = detectarCategoriaGenerica("quiero una hamburguesa");
  assert.equal(r.categoria, "hamburguesa");
  assert.ok(r.opciones.length > 0);
});

test("'una hamburguesa clasica' no debe convertirse en una michelada", () => {
  const items = parsearPedidoConMenu("una hamburguesa clasica");
  assert.notEqual(items[0].categoria, "michelada");
});
