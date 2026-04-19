const { db, siguienteId } = require("../db/database");

function procesarReserva({ telefono, jid, data }) {
  const idReserva = siguienteId("reservas");
  db.prepare(
    "INSERT INTO reservas " +
    "(id, nombre, telefono, jid_cliente, zona, fecha, fecha_texto, hora, personas, decoracion, observaciones, observaciones_admin) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    idReserva,
    data.nombre,
    telefono,
    jid,
    data.zona,
    data.fecha_iso,
    data.fecha_texto || null,
    data.hora,
    data.personas,
    data.decoracion || null,
    data.observaciones || null,
    data.observaciones || null
  );
  const nl = "\n";

  const textoCliente =
    "\u2705 Muchas gracias. Tu solicitud de reserva ha sido registrada correctamente:" + nl +
    "En unos minutos nuestro equipo validar\u00e1 la disponibilidad y te confirmar\u00e1 la reserva por este medio." + nl + nl +
    "HORARIO DE RESERVAS:" + nl +
    "\u{1F4AB} Martes a S\u00e1bado: De 11:30a.m a 8:30p.m (El servicio de Cocina es hasta las 9:30p.m y el restaurante est\u00e1 abierto hasta las 10:00p.m)" + nl +
    "\u{1F4AB} Domingos: De 11:30a.m a 3:00p.m y de 6:00pm a 8:30pm." + nl + nl +
    "\u00a1IMPORTANTE\!" + nl +
    "\u{1F9CF}\u{1F3FC} La reserva te garantiza el lugar, m\u00e1s no la hora de servicio, tu pedido ingresa a cocina en orden de llegada, respetando el orden de las mesas anteriores en el lugar." + nl +
    "\u{1F4A5} La reserva no tiene costo, es solo el consumo, por tal motivo se debe de garantizar la totalidad de este, en el restaurante." + nl +
    "\u{1F6AB} No est\u00e1 permitida la entrada de bebidas, gaseosas o alcoh\u00f3licas, gracias por la comprensi\u00f3n." + nl +
    "\u26A0\uFE0F Debes avisar con anticipaci\u00f3n si llevan un grupo musical, as\u00ed organizamos los tiempos y espacios evitando incomodidad con los dem\u00e1s clientes." + nl +
    "\u{1F4B3} El pago de la cuenta es responsabilidad de quien hace la reserva y el pago de esta NO se permite de forma individual." + nl +
    "\u{1F4B4} Se debe realizar un anticipo del 50% (Cuando la reserva ya tiene pedido anticipado y la cantidad de personas es mayor de 10), y este debe de hacerse en Efectivo." + nl + nl +
    "Muchas gracias\u{1F917}" + nl + nl +
    "Si deseas volver al men\u00fa, escribe *menu*.";

  const textoAdmin =
    "\u{1F4CC} Nueva reserva #" + idReserva + nl + nl +
    "\u{1F464} Nombre: " + data.nombre + nl +
    "\u{1F4DE} ID cliente: " + telefono + nl +
    "\u{1F4CD} Ubicaci\u00f3n: " + data.zona + nl +
    "\u{1F4C5} Fecha: " + data.fecha_iso + nl +
    "\u{1F552} Hora: " + data.hora + nl +
    "\u{1F465} N\u00b0 Asistentes: " + data.personas + nl +
    "\u{1F389} Decoraci\u00f3n: " + (data.decoracion ? "Plan " + data.decoracion : "No") + nl +
    "\u{1F4DD} Men\u00fa / Observaciones: " + (data.observaciones || "Ninguna") + nl + nl +
    "Comandos:" + nl +
    "- confirmar " + idReserva + nl +
    "- rechazar " + idReserva + nl +
    "- reserva " + idReserva + " mesa 4";

  return {
    textoCliente: textoCliente,
    notificarAdmin: {
      texto: textoAdmin
    }
  };
}

module.exports = { procesarReserva };
