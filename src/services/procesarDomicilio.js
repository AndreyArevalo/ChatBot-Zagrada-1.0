const { db, siguienteId } = require("../db/database");

function procesarDomicilio({ telefono, jid, data }) {
  const pedidoItems = Array.isArray(data.pedidoItems) ? data.pedidoItems : [];
  const pedidoTexto = pedidoItems.join(" | ");
  const formaPago = String(data.formaPago || "").trim().toLowerCase();

  const idDomicilio = siguienteId("domicilios");
  db.prepare(`
    INSERT INTO domicilios
    (
      id,
      nombre,
      telefono,
      jid_cliente,
      contacto,
      direccion,
      forma_pago,
      observaciones,
      pedido,
      fecha_servicio
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    idDomicilio,
    data.nombre,
    telefono,
    jid,
    data.contacto || null,
    data.direccion,
    data.formaPago || null,
    data.observaciones || null,
    pedidoTexto,
    data.fecha_iso || new Date().toISOString().slice(0, 10)
  );

  const saltoLinea = "\n";
  const listaItems = pedidoItems.join(saltoLinea + "- ");

  const bloqueMediosPago =
    formaPago && formaPago !== "efectivo"
      ? saltoLinea + saltoLinea +
        "\u{1F4B3} MEDIOS DE PAGO:" + saltoLinea +
        "\u2022 Bancolombia:" + saltoLinea +
        " 31872338104 Ahorros" + saltoLinea +
        " Leinny P\u00e1ez" + saltoLinea +
        " CC. 1148441068" + saltoLinea + saltoLinea +
        "\u2022 Crediservir:" + saltoLinea +
        " 3118019881" + saltoLinea +
        " Yeison Garcia" + saltoLinea + saltoLinea +
        "\u2022 Daviplata:" + saltoLinea +
        " 3209632635"
      : "";

  const textoCliente =
    "\u2705 Muchas gracias. Tu solicitud de domicilio ha sido registrada correctamente:" + saltoLinea + saltoLinea +
    "En unos minutos nuestro equipo revisar\u00e1 el pedido y te confirmar\u00e1 por este medio." +
    bloqueMediosPago;

  const textoAdmin =
    "\u{1F6F5} Nuevo domicilio #" + idDomicilio + saltoLinea + saltoLinea +
    "\u{1F464} Nombre: " + data.nombre + saltoLinea +
    "\u{1F4DE} ID cliente: " + telefono + saltoLinea +
    "\u{1F4DE} Contacto: " + (data.contacto || telefono) + saltoLinea +
    "\u{1F4CD} Direcci\u00f3n: " + data.direccion + saltoLinea +
    "\u{1F4B3} Forma de pago: " + (data.formaPago || "No definida") + saltoLinea +
    "\u{1F4DD} Observaciones: " + (data.observaciones || "Ninguna") + saltoLinea +
    "\u{1F6F5} Pedido:" + saltoLinea +
    "- " + listaItems + saltoLinea + saltoLinea +
    "Estado: pendiente" + saltoLinea + saltoLinea +
    "Comandos:" + saltoLinea +
    "- confirmar domicilio " + idDomicilio + saltoLinea +
    "- rechazar domicilio " + idDomicilio;

  return {
    textoCliente,
    notificarAdmin: {
      texto: textoAdmin
    }
  };
}

module.exports = { procesarDomicilio };
