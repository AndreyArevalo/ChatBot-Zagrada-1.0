function calcularFaltantesReserva(data = {}) {
  const faltantes = [];

  if (!data.zona) faltantes.push("zona");
  if (!data.fecha_iso) faltantes.push("fecha");
  if (!data.hora) faltantes.push("hora");
  if (!data.personas) faltantes.push("personas");
  if (!data.nombre) faltantes.push("nombre");
  if (!data.celular) faltantes.push("celular");

  return faltantes;
}

function calcularFaltantesDomicilio(data = {}) {
  const faltantes = [];

  if (!data.nombre) faltantes.push("nombre");
  if (!data.contacto) faltantes.push("contacto");
  if (!data.direccion) faltantes.push("direccion");
  if (!data.formaPago) faltantes.push("formaPago");
  if (!Array.isArray(data.pedidoItems) || data.pedidoItems.length === 0) {
    faltantes.push("pedidoItems");
  }

  return faltantes;
}

function preguntaPorFaltante(tipo, faltante, data = {}) {
  if (tipo === "reserva") {
    if (faltante === "zona") {
      return "Perfecto. \u00bfEn qu\u00e9 ubicaci\u00f3n deseas la reserva?\n\n1. Sal\u00f3n principal\n2. Terraza";
    }
    if (faltante === "fecha") {
      return "Perfecto. \u00bfPara qu\u00e9 fecha deseas la reserva?\n\nPor ejemplo:\n- ma\u00f1ana\n- s\u00e1bado\n- 25 de abril";
    }
    if (faltante === "hora") {
      return "Perfecto. \u00bfA qu\u00e9 hora ser\u00eda la reserva?";
    }
    if (faltante === "personas") {
      return "Perfecto. \u00bfPara cu\u00e1ntas personas ser\u00eda la reserva?";
    }
    if (faltante === "nombre") {
      return "Perfecto. \u00bfA nombre de qui\u00e9n quedar\u00e1 la reserva?";
    }
    if (faltante === "celular") {
      return "Perfecto. \u00bfCu\u00e1l es tu n\u00famero de celular para contactarte?";
    }
  }

  if (tipo === "domicilio") {
    if (faltante === "nombre") {
      return "Perfecto. \u00bfA nombre de qui\u00e9n quedar\u00e1 el domicilio?";
    }
    if (faltante === "contacto") {
      return "Perfecto. \u00bfCu\u00e1l es el contacto (n\u00famero de tel\u00e9fono) para el domicilio?";
    }
    if (faltante === "direccion") {
      return "Perfecto. \u00bfCu\u00e1l es la direcci\u00f3n de entrega?";
    }
    if (faltante === "formaPago") {
      return "Perfecto. \u00bfCu\u00e1l ser\u00e1 la forma de pago?\n\nPor ejemplo:\n- efectivo\n- transferencia (Bancolombia / Daviplata / Crediservir)";
    }
    if (faltante === "pedidoItems") {
      return "Perfecto. Ahora s\u00ed, escr\u00edbeme tu pedido. Puedes enviarlo todo en un solo mensaje o por partes.";
    }
  }

  return "Perfecto. \u00bfMe regalas el dato que falta, por favor?";
}

function preguntaObservacionesReserva() {
  return "\u00bfDeseas agregar alguna observaci\u00f3n para tu reserva?\n\nPor ejemplo:\n- celebraci\u00f3n de cumplea\u00f1os\n- alergias / restricciones\n- plato para evento\n- silla para beb\u00e9\n\nSi no tienes observaciones, escribe *no*.";
}

function preguntaObservacionesDomicilio() {
  return "\u00bfDeseas agregar alguna observaci\u00f3n a tu pedido?\n\nPor ejemplo:\n- sin cebolla\n- dejar en porter\u00eda\n- tocar el timbre dos veces\n- llamar al llegar\n\nSi no tienes observaciones, escribe *no*.";
}

function crearResumenReserva(data = {}) {
  return "Por favor revisa tu reserva:\n\n\ud83d\udc64 Nombre: " + (data.nombre || "No definido") +
    "\n\ud83d\udcde Celular: " + (data.celular || "No definido") +
    "\n\ud83d\udccd Ubicaci\u00f3n: " + (data.zona || "No definida") +
    "\n\ud83d\udcc5 Fecha: " + (data.fecha_iso || "No definida") +
    "\n\ud83d\udd52 Hora: " + (data.hora || "No definida") +
    "\n\ud83d\udc65 N\u00b0 Asistentes: " + (data.personas || "No definido") +
    "\n\ud83c\udf89 Decoraci\u00f3n: " + (data.decoracion ? "Plan " + data.decoracion : "No") +
    "\n\ud83d\udcdd Observaciones: " + (data.observaciones || "Ninguna") +
    "\n\ud83c\udf7d\ufe0f Men\u00fa: " + (data.menu_reserva || "Lo eligen en el restaurante") +
    "\n\n\u00bfConfirmas esta reserva?\nResponde:\n- s\u00ed\n- no (para corregir alg\u00fan dato)";
}

function preguntaDecoracionReserva() {
  return "Perfecto. \u00bfDeseas agregar decoraci\u00f3n a tu reserva?\n\nResponde:\n- s\u00ed\n- no";
}

function esTextoConfirmacionPedido(texto) {
  const t = (texto || "").trim().toLowerCase();
  return [
    "confirmar","confirmo","listo","ya","eso es todo","solo eso",
    "termin\u00e9","termine","finalizar","ok confirmar","confirmar pedido"
  ].includes(t);
}

function esTextoAgregarPedido(texto) {
  const t = (texto || "").trim().toLowerCase();
  return [
    "agregar","a\u00f1adir","anadir","sumar","quiero agregar","agrega",
    "agregar m\u00e1s","agregar mas","a\u00f1adir mas","a\u00f1adir m\u00e1s","quiero a\u00f1adir"
  ].includes(t);
}

function esTextoVaciarPedido(texto) {
  const t = (texto || "").trim().toLowerCase();
  return [
    "vaciar pedido","vaciar carrito","vaciar","borrar pedido",
    "limpiar pedido","eliminar pedido","empezar de cero",
    "empezar denuevo","empezar de nuevo","reiniciar pedido"
  ].includes(t);
}

function esTextoModificarPedido(texto) {
  const t = (texto || "").trim().toLowerCase();
  return [
    "modificar pedido","editar pedido","corregir pedido",
    "cambiar pedido","modificar","editar"
  ].includes(t);
}

function extraerTextoQuitarPedido(texto) {
  const t = (texto || "").trim().toLowerCase();
  const patrones = [
    /^quitar\s+(.+)$/,
    /^quita\s+(.+)$/,
    /^quitame\s+(.+)$/,
    /^qu\u00edtame\s+(.+)$/,
    /^eliminar\s+(.+)$/,
    /^elimina\s+(.+)$/,
    /^borrar\s+(.+)$/,
    /^borra\s+(.+)$/,
    /^remover\s+(.+)$/,
    /^remueve\s+(.+)$/,
    /^sacar\s+(.+)$/,
    /^saca\s+(.+)$/
  ];

  for (const patron of patrones) {
    const match = t.match(patron);
    if (match) return match[1].trim();
  }

  return null;
}

function normalizarItemParaComparar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^\s*\d+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function quitarItemDelPedido(pedidoItems = [], textoAEliminar = "") {
  const claveBuscada = normalizarItemParaComparar(textoAEliminar);
  if (!claveBuscada) {
    return { pedido: [...pedidoItems], eliminados: [] };
  }

  const eliminados = [];
  const restantes = [];

  for (const item of pedidoItems) {
    const claveItem = normalizarItemParaComparar(item);

    if (
      claveItem === claveBuscada ||
      claveItem.includes(claveBuscada) ||
      claveBuscada.includes(claveItem)
    ) {
      eliminados.push(item);
      continue;
    }

    restantes.push(item);
  }

  return { pedido: restantes, eliminados };
}

function crearResumenDomicilio(data = {}) {
  const items = Array.isArray(data.pedidoItems) ? data.pedidoItems : [];
  return "Por favor revisa tu pedido:\n\n\ud83d\udc64 Nombre: " + (data.nombre || "No definido") +
    "\n\ud83d\udcde Contacto: " + (data.contacto || "No definido") +
    "\n\ud83d\udccd Direcci\u00f3n: " + (data.direccion || "No definida") +
    "\n\ud83d\udcb3 Forma de pago: " + (data.formaPago || "No definida") +
    "\n\ud83d\udcdd Observaciones: " + (data.observaciones || "Ninguna") +
    "\n\ud83d\udef5 Pedido:\n- " + items.join("\n- ") +
    "\n\n\u00bfConfirmas este domicilio?\nResponde:\n- s\u00ed\n- no (para modificar el pedido)";
}

function crearEstadoPedido(data = {}) {
  const items = Array.isArray(data.pedidoItems) ? data.pedidoItems : [];
  if (!items.length) {
    return "Tu pedido est\u00e1 vac\u00edo. Escr\u00edbeme qu\u00e9 deseas ordenar, por favor.";
  }
  return "Perfecto, llevo esto en tu pedido:\n- " + items.join("\n- ") +
    "\n\nPuedes:\n- seguir agregando productos (solo escr\u00edbelos)\n- *quitar <producto>* para eliminarlo\n- *vaciar pedido* para empezar de cero\n- *confirmar* o *solo eso* si ya est\u00e1 completo";
}

module.exports = {
  calcularFaltantesReserva,
  calcularFaltantesDomicilio,
  preguntaPorFaltante,
  preguntaObservacionesReserva,
  preguntaObservacionesDomicilio,
  esTextoConfirmacionPedido,
  esTextoAgregarPedido,
  esTextoVaciarPedido,
  esTextoModificarPedido,
  extraerTextoQuitarPedido,
  quitarItemDelPedido,
  crearResumenDomicilio,
  crearEstadoPedido,
  crearResumenReserva,
  preguntaDecoracionReserva
};
