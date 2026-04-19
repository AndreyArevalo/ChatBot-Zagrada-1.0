const db = require("../db/database");
const { normalizarFechaNatural } = require("../services/normalizadorFecha");
function obtenerEstadoVisual(estado) {
    if (estado === "confirmada") return `🟢 Estado: ${estado}`;
    if (estado === "rechazada") return `🔴 Estado: ${estado}`;
    if (estado === "completada") return `🔵 Estado: ${estado}`;
    return `🟡 Estado: ${estado}`;
}

function obtenerConfig(clave) {
    const fila = db
        .prepare(`SELECT valor FROM configuracion WHERE clave = ?`)
        .get(clave);

    return fila ? fila.valor : null;
}

function guardarConfig(clave, valor) {
    db.prepare(`
    INSERT INTO configuracion (clave, valor)
    VALUES (?, ?)
    ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
  `).run(clave, valor);
}

function hoyISO(fecha = new Date()) {
    return fecha.toISOString().slice(0, 10);
}

function crearFechaHoraLocal(baseDate, horaTexto) {
    const [h, m] = String(horaTexto || "00:00")
        .split(":")
        .map(Number);

    const d = new Date(baseDate);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
}

function calcularProximaReaperturaDomicilios(horaInicio, ahora = new Date()) {
    const aperturaHoy = crearFechaHoraLocal(ahora, horaInicio);

    if (ahora < aperturaHoy) {
        return aperturaHoy.toISOString();
    }

    const siguiente = new Date(aperturaHoy);
    siguiente.setDate(siguiente.getDate() + 1);
    return siguiente.toISOString();
}

async function manejarMensajeAdmin({ mensaje }) {
    const texto = (mensaje || "").trim().toLowerCase();

    if (!texto) {
        return "Comando vacío.";
    }

    if (texto === "admin" || texto === "menu admin" || texto === "menú admin") {

        return `👨‍💼 *Panel administrador Zagrada*

Comandos disponibles:
- confirmar domicilio ID
- rechazar domicilio ID
- ver domicilios confirmados
- ver domicilios rechazados
- domicilios on
- domicilios off
- restaurante abierto
- restaurante cerrado
- horario domicilios HH:MM HH:MM
- ver configuracion
- estadisticas
- estadisticas YYYY-MM
- ver reservas hoy / ver reservas ma\u00f1ana / ver reservas martes\r\n- ver reservas pendientes
- ver reservas confirmadas
- ver reservas rechazadas
- ver domicilios
- ver domicilios pendientes
- confirmar ID
- rechazar ID
- reserva ID mesa CODIGO

Ejemplos:
- confirmar 2
- rechazar 3
- reserva 2 mesa 4
- domicilios on
- domicilios off
- restaurante abierto
- restaurante cerrado
- estadisticas
- estadisticas 2025-03`;
    }

    if (texto === "ver reservas") {
        const reservas = db
            .prepare(`
        SELECT id, nombre, telefono, fecha, hora, zona, personas, decoracion, mesa, estado
        FROM reservas
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!reservas.length) {
            return "No hay reservas registradas.";
        }

        return reservas
            .map((r) => {
                return `#${r.id} | ${r.nombre}
📞 ${r.telefono}
📅 ${r.fecha} - ${r.hora}
📍 ${r.zona}
👥 ${r.personas}
🎉 ${r.decoracion ? `Plan ${r.decoracion}` : "Sin decoración"}
🪑 ${r.mesa || "Sin asignar"}
${obtenerEstadoVisual(r.estado)}`;
            })
            .join("\n\n");
    }

    const matchVerFecha = texto.match(/^ver reservas\s+(.+)$/i);
    if (matchVerFecha) {
        const argFecha = matchVerFecha[1].trim();
        const fechaRes = normalizarFechaNatural(argFecha);
        if (!fechaRes.valido) {
            return `No reconoc\u00ed la fecha "${argFecha}". Prueba con: hoy, ma\u00f1ana, martes, 25 de abril, 2026-04-25`;
        }
        const fechaISO = fechaRes.fechaISO;
        const reservas = db
            .prepare(`
        SELECT id, nombre, telefono, fecha, hora, zona, personas, decoracion, observaciones, menu_reserva, mesa, estado
        FROM reservas
        WHERE fecha = ?
        ORDER BY hora ASC
      `)
            .all(fechaISO);
        if (!reservas.length) {
            return `No hay reservas para el ${fechaISO}.`;
        }
        const encabezado = `\ud83d\udcc5 Reservas para el *${fechaISO}* (${reservas.length})\n\n`;
        return encabezado + reservas
            .map((r) => {
                let txt = `#${r.id} | ${r.nombre}\n`
                    + `\ud83d\udcde ${r.telefono}\n`
                    + `\ud83d\udd52 ${r.hora}\n`
                    + `\ud83d\udccd ${r.zona}\n`
                    + `\ud83d\udc65 ${r.personas} personas\n`
                    + `\ud83c\udf89 ${r.decoracion ? `Plan ${r.decoracion}` : "Sin decoraci\u00f3n"}\n`;
                if (r.observaciones) txt += `\ud83d\udcdd ${r.observaciones}\n`;
                if (r.menu_reserva) txt += `\ud83c\udf7d\ufe0f Men\u00fa: ${r.menu_reserva}\n`;
                txt += `\ud83e\ude51 Mesa: ${r.mesa || "Sin asignar"}\n`
                    + obtenerEstadoVisual(r.estado);
                return txt;
            })
            .join("\n\n");
    }

    if (texto === "ver reservas pendientes") {
        const reservas = db
            .prepare(`
        SELECT id, nombre, telefono, fecha, hora, zona, personas, decoracion, mesa, estado
        FROM reservas
        WHERE estado = 'pendiente'
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!reservas.length) {
            return "No hay reservas pendientes.";
        }

        return reservas
            .map((r) => {
                return `#${r.id} | ${r.nombre}
📞 ${r.telefono}
📅 ${r.fecha} - ${r.hora}
📍 ${r.zona}
👥 ${r.personas}
🎉 ${r.decoracion ? `Plan ${r.decoracion}` : "Sin decoración"}
🪑 ${r.mesa || "Sin asignar"}
${obtenerEstadoVisual(r.estado)}`;
            })
            .join("\n\n");
    }

    if (texto === "ver reservas confirmadas") {
        const reservas = db
            .prepare(`
        SELECT id, nombre, telefono, fecha, hora, zona, personas, decoracion, mesa, estado
        FROM reservas
        WHERE estado = 'confirmada'
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!reservas.length) {
            return "No hay reservas confirmadas.";
        }

        return reservas
            .map((r) => {
                return `#${r.id} | ${r.nombre}
📞 ${r.telefono}
📅 ${r.fecha} - ${r.hora}
📍 ${r.zona}
👥 ${r.personas}
🎉 ${r.decoracion ? `Plan ${r.decoracion}` : "Sin decoración"}
🪑 ${r.mesa || "Sin asignar"}
${obtenerEstadoVisual(r.estado)}`;
            })
            .join("\n\n");
    }

    if (texto === "ver reservas rechazadas") {
        const reservas = db
            .prepare(`
        SELECT id, nombre, telefono, fecha, hora, zona, personas, decoracion, mesa, estado
        FROM reservas
        WHERE estado = 'rechazada'
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!reservas.length) {
            return "No hay reservas rechazadas.";
        }

        return reservas
            .map((r) => {
                return `#${r.id} | ${r.nombre}
📞 ${r.telefono}
📅 ${r.fecha} - ${r.hora}
📍 ${r.zona}
👥 ${r.personas}
🎉 ${r.decoracion ? `Plan ${r.decoracion}` : "Sin decoración"}
🪑 ${r.mesa || "Sin asignar"}
${obtenerEstadoVisual(r.estado)}`;
            })
            .join("\n\n");
    }

    if (texto === "ver domicilios") {
        const domicilios = db
            .prepare(`
        SELECT id, nombre, telefono, direccion, pedido, estado
        FROM domicilios
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!domicilios.length) {
            return "No hay domicilios registrados.";
        }

        return domicilios
            .map((d) => {
                return `#${d.id} | ${d.nombre}
📞 ${d.telefono}
📍 ${d.direccion}
🛵 ${d.pedido}
${obtenerEstadoVisual(d.estado)}`;
            })
            .join("\n\n");
    }

    if (texto === "ver domicilios pendientes") {
        const domicilios = db
            .prepare(`
        SELECT id, nombre, telefono, direccion, pedido, estado
        FROM domicilios
        WHERE estado = 'pendiente'
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!domicilios.length) {
            return "No hay domicilios pendientes.";
        }

        return domicilios
            .map((d) => {
                return `#${d.id} | ${d.nombre}
📞 ${d.telefono}
📍 ${d.direccion}
🛵 ${d.pedido}
${obtenerEstadoVisual(d.estado)}`;
            })
            .join("\n\n");
    }


    if (texto === "ver domicilios confirmados") {
        const domicilios = db
            .prepare(`
        SELECT id, nombre, telefono, direccion, pedido, estado
        FROM domicilios
        WHERE estado = 'confirmado'
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!domicilios.length) {
            return "No hay domicilios confirmados.";
        }

        return domicilios
            .map((d) => {
                return `#${d.id} | ${d.nombre}
📞 ${d.telefono}
📍 ${d.direccion}
🛵 ${d.pedido}
${obtenerEstadoVisual(d.estado)}`;
            })
            .join("\n\n");
    }

    if (texto === "ver domicilios rechazados") {
        const domicilios = db
            .prepare(`
        SELECT id, nombre, telefono, direccion, pedido, estado
        FROM domicilios
        WHERE estado = 'rechazado'
        ORDER BY id DESC
        LIMIT 10
      `)
            .all();

        if (!domicilios.length) {
            return "No hay domicilios rechazados.";
        }

        return domicilios
            .map((d) => {
                return `#${d.id} | ${d.nombre}
📞 ${d.telefono}
📍 ${d.direccion}
🛵 ${d.pedido}
${obtenerEstadoVisual(d.estado)}`;
            })
            .join("\n\n");
    }

    const matchConfirmar = texto.match(/^confirmar\s+#?\s*(\d+)$/i);
    if (matchConfirmar) {
        const id = Number(matchConfirmar[1]);

        const reserva = db
            .prepare(`
      SELECT id, nombre, telefono, jid_cliente, fecha, hora, zona, personas, decoracion, mesa
      FROM reservas
      WHERE id = ?
    `)
            .get(id);

        if (!reserva) {
            return `No encontré la reserva #${id}.`;
        }

        db.prepare(`
    UPDATE reservas
    SET estado = 'confirmada'
    WHERE id = ?
  `).run(id);

        const textoAdmin = `✅ Reserva #${id} confirmada correctamente.

👤 ${reserva.nombre}
🪑 Mesa: ${reserva.mesa || "Sin asignar"}`;

        const textoCliente = `✅ Tu reserva en Zagrada ha sido confirmada.

📅 Fecha: ${reserva.fecha}
🕒 Hora: ${reserva.hora}
📍 Ubicación: ${reserva.zona}
👥 N° Asistentes: ${reserva.personas}
🎉 Decoración: ${reserva.decoracion ? "Plan " + reserva.decoracion : "No"}
🪑 Mesa: ${reserva.mesa || "Por asignar"}

Te esperamos.`;

        return {
            textoAdmin,
            notificarCliente: reserva.jid_cliente
                ? {
                    jid: reserva.jid_cliente,
                    texto: textoCliente
                }
                : null,
            notificarGrupo: {
                texto: `✅ Reserva confirmada #${id}

👤 ${reserva.nombre}
📅 ${reserva.fecha}
🕒 ${reserva.hora}
📍 ${reserva.zona}
👥 ${reserva.personas}
🎉 ${reserva.decoracion ? "Plan " + reserva.decoracion : "No"}
🪑 Mesa: ${reserva.mesa || "Por asignar"}`
            }
        };
    }

    // Línea aprox. 220
    const matchRechazar = texto.match(/^rechazar\s+#?\s*(\d+)$/i);
    if (matchRechazar) {
        const id = Number(matchRechazar[1]);

        const reserva = db
            .prepare(`
        SELECT id, nombre, telefono, fecha, hora, zona, personas
        FROM reservas
        WHERE id = ?
      `)
            .get(id);

        if (!reserva) {
            return `No encontré la reserva #${id}.`;
        }

        db.prepare(`
      UPDATE reservas
      SET estado = 'rechazada'
      WHERE id = ?
    `).run(id);

        const textoAdmin = `❌ Reserva #${id} rechazada correctamente.

👤 ${reserva.nombre}`;

        const textoCliente = `Hola, te informamos que por el momento no fue posible confirmar tu reserva en Zagrada.

📅 Fecha solicitada: ${reserva.fecha}
🕒 Hora solicitada: ${reserva.hora}
📍 Ubicación: ${reserva.zona}
👥 N° Asistentes: ${reserva.personas}

Si deseas, puedes escribir *menu* para intentar con otra fecha u horario.`;

        return {
            textoAdmin,
            notificarCliente: {
                jid: `${reserva.telefono}@lid`,
                texto: textoCliente
            }
        };
    }

    const matchReservaMesa = texto.match(/^reserva\s+(\d+)\s+mesa\s+([a-z0-9_-]+)$/i);
    if (matchReservaMesa) {
        const id = Number(matchReservaMesa[1]);
        const codigoMesa = matchReservaMesa[2].toUpperCase();

        const reserva = db
            .prepare(`
        SELECT id, nombre
        FROM reservas
        WHERE id = ?
      `)
            .get(id);

        if (!reserva) {
            return `No encontré la reserva #${id}.`;
        }

        db.prepare(`
      UPDATE reservas
      SET mesa = ?
      WHERE id = ?
    `).run(codigoMesa, id);

        return `🪑 Mesa asignada correctamente.

Reserva #${id}
👤 ${reserva.nombre}
🪑 Mesa: ${codigoMesa}`;
    }

    if (texto === "domicilios on") {
    guardarConfig("domicilios_activos", "on");
    guardarConfig("domicilios_reapertura", "");

    return `✅ Domicilios activados correctamente.

Estado actual:
- Domicilios: on`;
}

if (texto === "domicilios off") {
    const horaInicio = obtenerConfig("hora_inicio_domicilios") || "12:00";
    const reapertura = calcularProximaReaperturaDomicilios(horaInicio);

    guardarConfig("domicilios_activos", "off");
    guardarConfig("domicilios_reapertura", reapertura);

    return `⛔ Domicilios desactivados correctamente.

Se reactivarán automáticamente en la próxima hora de apertura.

Estado actual:
- Domicilios: off
- Reactivación programada: ${reapertura}`;
}

    if (texto === "restaurante cerrado") {
    guardarConfig("restaurante_cerrado", "on");
    guardarConfig("apertura_excepcional_fecha", "");

    return `⛔ Restaurante marcado como cerrado.

Estado actual:
- Restaurante: cerrado
- Lunes: cerrado por defecto`;
}

if (texto === "restaurante abierto") {
    guardarConfig("restaurante_cerrado", "off");

    if ((new Date()).getDay() === 1) {
        guardarConfig("apertura_excepcional_fecha", hoyISO());
    } else {
        guardarConfig("apertura_excepcional_fecha", "");
    }

    return `✅ Restaurante habilitado.

Estado actual:
- Restaurante: abierto
- Lunes: ${((new Date()).getDay() === 1) ? "abierto solo hoy" : "cerrado por defecto"}`;
}

    const matchConfirmarDomicilio = texto.match(/^confirmar\s+domicilio\s+#?\s*(\d+)$/i);
    if (matchConfirmarDomicilio) {
        const id = Number(matchConfirmarDomicilio[1]);

        const domicilio = db
            .prepare(`
      SELECT id, nombre, telefono, jid_cliente, direccion, pedido
      FROM domicilios
      WHERE id = ?
    `)
            .get(id);

        if (!domicilio) {
            return `No encontré el domicilio #${id}.`;
        }

        db.prepare(`
    UPDATE domicilios
    SET estado = 'confirmado'
    WHERE id = ?
  `).run(id);

        const textoAdmin = `✅ Domicilio #${id} confirmado correctamente.

👤 ${domicilio.nombre}`;

        const textoCliente = `✅ Tu domicilio en Zagrada ha sido tomado y confirmado correctamente
        gracias por tu pedido😊.`;

        return {
            textoAdmin,
            notificarCliente: domicilio.jid_cliente
                ? {
                    jid: domicilio.jid_cliente,
                    texto: textoCliente
                }
                : null
        };
    }


    const matchRechazarDomicilio = texto.match(/^rechazar\s+domicilio\s+#?\s*(\d+)$/i);
    if (matchRechazarDomicilio) {
        const id = Number(matchRechazarDomicilio[1]);

        const domicilio = db
            .prepare(`
      SELECT id, nombre, telefono, jid_cliente, direccion, pedido
      FROM domicilios
      WHERE id = ?
    `)
            .get(id);

        if (!domicilio) {
            return `No encontré el domicilio #${id}.`;
        }

        db.prepare(`
    UPDATE domicilios
    SET estado = 'rechazado'
    WHERE id = ?
  `).run(id);

        const textoAdmin = `❌ Domicilio #${id} rechazado correctamente.

👤 ${domicilio.nombre}`;

        const textoCliente = `Hola, por el momento no fue posible confirmar tu domicilio en Zagrada🥹 depronto no tenemos algún plato disponible, en unos minutos nuestro equipo se pondra en contacto contigo.`;

        return {
            textoAdmin,
            notificarCliente: domicilio.jid_cliente
                ? {
                    jid: domicilio.jid_cliente,
                    texto: textoCliente
                }
                : null
        };
    }


    const matchHorarioDomicilios = texto.match(/^horario\s+domicilios\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})$/i);
    if (matchHorarioDomicilios) {
        const horaInicio = matchHorarioDomicilios[1];
        const horaFin = matchHorarioDomicilios[2];

        guardarConfig("hora_inicio_domicilios", horaInicio);
        guardarConfig("hora_fin_domicilios", horaFin);

        return `🕒 Horario de domicilios actualizado correctamente.

Nuevo horario:
- Inicio: ${horaInicio}
- Fin: ${horaFin}`;
    }

    if (texto === "ver configuracion" || texto === "ver configuración") {
    const domiciliosActivos = obtenerConfig("domicilios_activos") || "on";
    const horaInicio = obtenerConfig("hora_inicio_domicilios") || "12:00";
    const horaFin = obtenerConfig("hora_fin_domicilios") || "21:30";
    const lunesLaborable = obtenerConfig("lunes_laborable") || "off";
    const restauranteCerrado = obtenerConfig("restaurante_cerrado") || "off";
    const aperturaExcepcionalFecha = obtenerConfig("apertura_excepcional_fecha") || "";
    const domiciliosReapertura = obtenerConfig("domicilios_reapertura") || "";
    const hoy = hoyISO();

    const estadoLunes =
        lunesLaborable === "on"
            ? "abierto"
            : aperturaExcepcionalFecha === hoy
            ? "abierto solo hoy"
            : "cerrado por defecto";

    return `⚙️ Configuración actual de Zagrada

🛵 Domicilios: ${domiciliosActivos}
🕒 Horario domicilios: ${horaInicio} - ${horaFin}
🔁 Reactivación domicilios: ${domiciliosReapertura || "sin programación"}
📅 Lunes: ${estadoLunes}
🏪 Restaurante: ${restauranteCerrado === "on" ? "cerrado" : "abierto"}`;
}

    // ----------------------------------------------------------------
    // Estadísticas mensuales
    // ----------------------------------------------------------------
    if (/^estadisticas(\s+\d{4}-\d{2})?$/i.test(texto)) {
        var partes = texto.match(/estadisticas(?:\s+(\d{4}-\d{2}))?/i);
        var mes = (partes && partes[1]) ? partes[1] : new Date().toISOString().slice(0, 7);
        var partesMes = mes.split("-");
        var anio = partesMes[0]; var mesNum = partesMes[1];
        var rT = db.prepare("SELECT COUNT(*) as total FROM reservas WHERE strftime('%Y-%m', creado_en) = ?").get(mes);
        var rE = db.prepare("SELECT estado, COUNT(*) as total FROM reservas WHERE strftime('%Y-%m', creado_en) = ? GROUP BY estado").all(mes);
        var dT = db.prepare("SELECT COUNT(*) as total FROM domicilios WHERE strftime('%Y-%m', creado_en) = ?").get(mes);
        var dE = db.prepare("SELECT estado, COUNT(*) as total FROM domicilios WHERE strftime('%Y-%m', creado_en) = ? GROUP BY estado").all(mes);
        var rD = db.prepare("SELECT COUNT(*) as total FROM reservas WHERE strftime('%Y-%m', creado_en) = ? AND decoracion IS NOT NULL AND decoracion != ''").get(mes);
        var nombresM = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
        var nombreMes = nombresM[parseInt(mesNum, 10) - 1] || mes;
        var lR = rE.map(function(r){ return r.estado + ": " + r.total; }).join(" | ") || "ninguno";
        var lD = dE.map(function(r){ return r.estado + ": " + r.total; }).join(" | ") || "ninguno";
        var out = "Estadisticas " + nombreMes + " " + anio;
        out += "\nReservas: " + rT.total + " (" + lR + ") | Con deco: " + rD.total;
        out += "\nDomicilios: " + dT.total + " (" + lD + ")";
        out += "\nTotal: " + (rT.total + dT.total);
        out += "\n\nOtro mes: estadisticas YYYY-MM";
        return out;
    }

    return "Panel administrador Zagrada\n\nComandos:\n- confirmar domicilio ID\n- rechazar domicilio ID\n- domicilios on / off\n- restaurante abierto / cerrado\n- horario domicilios HH:MM HH:MM\n- ver configuracion\n- estadisticas\n- estadisticas YYYY-MM\n- ver reservas hoy / ver reservas ma\u00f1ana / ver reservas martes\r\n- ver reservas pendientes / confirmadas / rechazadas\n- ver domicilios / pendientes / confirmados / rechazados\n- confirmar ID / rechazar ID\n- reserva ID mesa CODIGO";
}

module.exports = { manejarMensajeAdmin };
