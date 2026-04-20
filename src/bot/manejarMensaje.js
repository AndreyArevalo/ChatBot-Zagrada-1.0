const path = require("path");
const { preguntarIA } = require("../services/ia");
const { db } = require("../db/database");
const {
  obtenerSesion,
  actualizarSesion,
  resetSesion,
  marcarSaludado,
  yaFueSaludado
} = require("../sessions/sessionManager");
const {
  validarHoraReserva,
  validarCantidadPersonas
} = require("../validators/reserva");
const { extraerIntencionYDatos } = require("../services/extractorIA");
const { normalizarFechaNatural } = require("../services/normalizadorFecha");
const {
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
  crearEstadoPedido,
  crearResumenReserva,
  crearResumenDomicilio
} = require("../services/faltantes");
const { procesarReserva } = require("../services/procesarReserva");
const { procesarDomicilio } = require("../services/procesarDomicilio");
const { parsearPedidoConMenu, detectarCategoriaGenerica } = require("../services/menuParser");

// ------------------------------------------------------------
// Helpers de decoracion
// ------------------------------------------------------------

const NOTA_DECORACION = "\n\n\uD83D\uDEA8 Nota: Las decoraciones se deben cancelar con anticipaci\u00f3n para poder ser realizada, muchas gracias por el apoyo y la comprensi\u00f3n.\uD83C\uDF88";

function obtenerPlanDecoracion(texto, aceptarNumeros = true) {
  const t = (texto || "").trim().toLowerCase();
  if ((aceptarNumeros && t === "1") || t === "plata" || t === "plan plata" || t.includes("plata")) return "Plata";
  if ((aceptarNumeros && t === "2") || t === "oro" || t === "plan oro" || t.includes("oro")) return "Oro";
  if ((aceptarNumeros && t === "3") || t === "diamante" || t === "plan diamante" || t.includes("diamante")) return "Diamante";
  return null;
}

function crearRespuestaPlan(plan) {
  if (plan === "Plata") {
    return {
      texto: "\uD83E\uDD48 Plan Plata \u2014 $60.000\n\nIncluye:\n- letrero HBD o LOVE iluminado\n- copa de sangr\u00eda o bebida frappeada\n- centro de mesa de globos est\u00e1ticos\n\nSi deseas este plan, puedes escribir:\n- quiero esa\n- esa me gusta\n- reservar con esa" + NOTA_DECORACION,
      imagenPath: path.join(__dirname, "../../assets/decoracion/plata.jpg"),
      nombreArchivo: "plata.jpg"
    };
  }
  if (plan === "Oro") {
    return {
      texto: "\uD83E\uDD47 Plan Oro \u2014 $70.000\n\nIncluye:\n- letrero HBD o LOVE iluminado\n- mini cake (chocolate, red velvet, yogurt y ar\u00e1ndanos)\n- centro de mesa de globos est\u00e1ticos\n\nSi deseas este plan, puedes escribir:\n- quiero esa\n- esa me gusta\n- reservar con esa" + NOTA_DECORACION,
      imagenPath: path.join(__dirname, "../../assets/decoracion/oro.jpg"),
      nombreArchivo: "oro.jpg"
    };
  }
  if (plan === "Diamante") {
    return {
      texto: "\uD83D\uDC8E Plan Diamante \u2014 $80.000\n\nIncluye:\n- letrero HBD o LOVE iluminado\n- copa de sangr\u00eda o c\u00f3ctel\n- mini cake (yogurt y ar\u00e1ndanos, chocolate o red velvet)\n- centro de mesa de globos est\u00e1ticos\n- vela volc\u00e1n o juego de velitas\n\nSi deseas este plan, puedes escribir:\n- quiero esa\n- esa me gusta\n- reservar con esa" + NOTA_DECORACION,
      imagenPath: path.join(__dirname, "../../assets/decoracion/diamante.jpg"),
      nombreArchivo: "diamante.jpg"
    };
  }
  return null;
}

function crearGaleriaDecoracionReserva() {
  return {
    tipo: "galeria_planes",
    texto: "Perfecto \u2728\n\nSi deseas agregar decoraci\u00f3n a tu reserva, aqu\u00ed tienes nuestros 3 planes.\n\nEscr\u00edbeme:\n- plata\n- oro\n- diamante\n- o no, si no deseas decoraci\u00f3n." + NOTA_DECORACION,
    imagenes: [
      { path: path.join(__dirname, "../../assets/decoracion/plata.jpg"), caption: "\uD83E\uDD48 Plan Plata \u2014 $60.000" },
      { path: path.join(__dirname, "../../assets/decoracion/oro.jpg"), caption: "\uD83E\uDD47 Plan Oro \u2014 $70.000" },
      { path: path.join(__dirname, "../../assets/decoracion/diamante.jpg"), caption: "\uD83D\uDC8E Plan Diamante \u2014 $80.000" }
    ]
  };
}

// ------------------------------------------------------------
// Saludo unico por sesion (20 min)
// ------------------------------------------------------------

function saludoPrefijo(telefono) {
  return yaFueSaludado(telefono) ? "" : "Hola, bienvenido a Zagrada. ";
}

function registrarSaludo(telefono) {
  marcarSaludado(telefono);
}

function conSaludoInicial(texto, telefono) {
  if (yaFueSaludado(telefono)) return texto;
  registrarSaludo(telefono);
  return "Hola, bienvenido a Zagrada. " + texto;
}

// ------------------------------------------------------------
// Formularios
// ------------------------------------------------------------

function crearFormularioReservaTexto(telefono) {
  const saludo = saludoPrefijo(telefono);
  if (saludo) registrarSaludo(telefono);
  return saludo + "Para ayudarte con tu reserva, por favor env\u00edanos estos datos:\n\n\uD83D\uDCC3 DATOS PARA RESERVA:\n- FECHA:\n- HORA:\n(Si han pasado 20 minutos y no han llegado a la reserva, se levanta el reservado).\n- N\u00b0 ASISTENTES:\n- UBICACI\u00d3N: (Sal\u00f3n principal o Terraza)\n- NOMBRE:\n- CELULAR:\n- MEN\u00da:";
}

function crearFormularioDomicilioTexto(telefono) {
  const saludo = saludoPrefijo(telefono);
  if (saludo) registrarSaludo(telefono);
  return saludo + "Para ayudarte con tu domicilio, por favor env\u00edanos estos datos:\n\n\uD83D\uDEF5 DOMICILIO\n- NOMBRE:\n- CONTACTO:\n- DIRECCI\u00d3N:\n- FORMA DE PAGO:";
}

// ------------------------------------------------------------
// Validacion de campos del formulario
// ------------------------------------------------------------

function tieneTextoReal(valor) {
  if (valor === null || valor === undefined) return false;
  const t = String(valor).trim().toLowerCase();
  return t !== "" && t !== "null" && t !== "undefined" && t !== "no definido" && t !== "nombre" && t !== "contacto" && t !== "direcci\u00f3n" && t !== "direccion" && t !== "forma de pago";
}

function tieneNombreValido(valor) {
  return tieneTextoReal(valor) && String(valor).trim().length >= 2;
}

function tieneContactoValido(valor) {
  return tieneTextoReal(valor) && String(valor).trim().length >= 5;
}

function tieneDireccionValida(valor) {
  return tieneTextoReal(valor) && String(valor).trim().length >= 5;
}

function tieneFormaPagoValida(valor) {
  return tieneTextoReal(valor) && String(valor).trim().length >= 3;
}

// ------------------------------------------------------------
// Helpers de texto
// ------------------------------------------------------------

function esRespuestaAfirmativa(texto) {
  const t = (texto || "").trim().toLowerCase();
  return ["si","s\u00ed","claro","de una","ok","dale","quiero esa","esa me gusta","me gusta esa","me gust\u00f3 esa","me gusto esa","quiero ese plan","quiero esa decoracion","quiero esa decoraci\u00f3n","reservar con esa","quiero reservar con esa","la quiero","esa","ese","quiero ese","quiero esa misma"].includes(t);
}

function esRespuestaNegativa(texto) {
  const t = (texto || "").trim().toLowerCase();
  return ["no","no quiero","sin decoracion","sin decoraci\u00f3n","ninguna","ninguno"].includes(t);
}

function esSaludoSimple(texto) {
  const t = (texto || "").trim().toLowerCase();
  return ["hola","holi","buenas","buenos dias","buenos d\u00edas","buenas tardes","buenas noches","menu","men\u00fa","inicio","empezar"].includes(t);
}

function esSolicitudReservaDirecta(texto) {
  const t = (texto || "").trim().toLowerCase();
  return /reserv(a|ar)/.test(t) && !esSaludoSimple(t);
}

function esSolicitudDomicilioDirecta(texto) {
  const t = (texto || "").trim().toLowerCase();
  return (t.includes("domicilio") || t.includes("domi") || t.includes("pedir")) && !t.includes("tienen domicilio") && !t.includes("tienen domicilios") && !t.includes("hacen domicilio") && !t.includes("hacen domicilios");
}

function esConsultaDomicilios(texto) {
  const t = (texto || "").trim().toLowerCase();
  return (t.includes("tienen domicilio") || t.includes("tienen domicilios") || t.includes("hacen domicilio") || t.includes("hacen domicilios") || t.includes("manejan domicilio") || t.includes("manejan domicilios") || t.includes("hay domicilio") || t.includes("hay domicilios")) && !t.includes("quiero") && !t.includes("calle") && !t.includes("#");
}

function mencionaPlatoEvento(texto) {
  const t = (texto || "").trim().toLowerCase();
  return t.includes("plato para evento") || t.includes("plato de evento") || t.includes("plato especial") || t.includes("menu para grupo") || t.includes("men\u00fa para grupo");
}

function obtenerConfig(clave) {
  const fila = db.prepare("SELECT valor FROM configuracion WHERE clave = ?").get(clave);
  return fila ? fila.valor : null;
}

// ------------------------------------------------------------
// Estado del restaurante (cierre por dia o manual)
// ------------------------------------------------------------

function hoyISO(fecha) {
  const d = fecha || new Date();
  return d.toISOString().slice(0, 10);
}

function verificarCierreRestaurante() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes
  const hoyStr = hoyISO(hoy);
  const lunesLaborable = obtenerConfig("lunes_laborable") || "off";
  const aperturaExcepcional = obtenerConfig("apertura_excepcional_fecha") || "";
  const restauranteCerrado = obtenerConfig("restaurante_cerrado") || "off";

  if (restauranteCerrado === "on") {
    return { cerrado: true, tipo: "manual" };
  }
  if (diaSemana === 1 && lunesLaborable !== "on" && aperturaExcepcional !== hoyStr) {
    return { cerrado: true, tipo: "lunes" };
  }
  return { cerrado: false };
}

function mensajeLunesCerrado() {
  return "Hola, un gusto saludarle \uD83D\uDE0A\n\nAgradecemos siempre el apoyo e informamos que los dias *Lunes* no laboramos.\n\nAun asi puedes:\n\uD83D\uDCCB Solicitar una *reserva* - nuestro equipo la confirmara cuanto antes en cuanto estemos disponibles\n\uD83D\uDCC4 Ver nuestra *carta* - escribe _carta_ o el numero _2_\n\u2728 Ver *planes de decoracion* - escribe _decoraciones_ o el numero _4_\n\n\u2139\uFE0F Horario de atencion: 8:00 am - 9:30 pm\n\uD83C\uDF7D\uFE0F Cocina y domicilios: 11:30 am - 9:00 pm (dias laborales)\n\nBuen dia y cualquier ayuda que necesites, quedamos atentos \uD83D\uDE4F\uD83C\uDFFE";
}

function mensajeRestauranteCerrado() {
  return "Hola, un gusto saludarle \uD83D\uDE0A\n\nAgradecemos siempre el apoyo. En este momento el restaurante no se encuentra disponible.\n\nAun asi puedes:\n\uD83D\uDCCB Solicitar una *reserva* - nuestro equipo la confirmara cuanto antes en cuanto estemos disponibles\n\uD83D\uDCC4 Ver nuestra *carta* - escribe _carta_ o el numero _2_\n\u2728 Ver *planes de decoracion* - escribe _decoraciones_ o el numero _4_\n\n\u2139\uFE0F Horario de atencion: 8:00 am - 9:30 pm\n\uD83C\uDF7D\uFE0F Cocina y domicilios: 11:30 am - 9:00 pm\n\nEn cuanto abramos estaremos atentos. Que tengas un excelente dia \uD83D\uDE4F\uD83C\uDFFE";
}

function mensajeDomicilioNoDisponible() {
  return "Hola\uD83E\uDD79 muchas gracias por comunicarte con nosotros\uD83D\uDE4F\uD83C\uDFFE\nHoy no tendremos servicio de Domicilios disponible (No sale comida empacada, para llevar).\nPedimos disculpas por las molestias y agradecemos su comprensi\u00f3n.\uD83D\uDE4F\uD83C\uDFFE";
}

function mensajeCierreParaDomicilio(tipo) {
  if (tipo === "lunes") return mensajeLunesCerrado();
  return mensajeRestauranteCerrado();
}

function pareceDireccion(texto) {
  const t = (texto || "").trim().toLowerCase();
  return t.includes("#") || t.includes("calle") || t.includes("carrera") || t.includes("cra") || t.includes("cr ") || t.includes("av") || t.includes("avenida") || t.includes("diag") || t.includes("trans") || t.includes("barrio");
}

function pareceNombre(texto) {
  const t = (texto || "").trim();
  return /^[a-zA-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00e1\u00e9\u00ed\u00f3\u00fa\u00d1\u00f1 ]{2,}$/.test(t) && !pareceDireccion(t);
}

function normalizarZona(zona) {
  if (!zona) return null;
  const t = String(zona).trim().toLowerCase();
  if (t === "1" || t.includes("sal\u00f3n") || t.includes("salon") || t.includes("sal\u00f3n principal") || t.includes("salon principal")) return "Sal\u00f3n principal";
  if (t === "2" || t.includes("terraza")) return "Terraza";
  return null;
}

function normalizarDecoracionLocal(valor) {
  if (!valor) return null;
  return obtenerPlanDecoracion(String(valor), true);
}

function normalizarFormaPago(valor) {
  if (!valor) return null;
  const t = String(valor).trim().toLowerCase();
  if (t.includes("efectivo") || t === "cash") return "Efectivo";
  if (t.includes("transfer") || t.includes("bancolombia") || t.includes("nequi") || t.includes("daviplata") || t.includes("crediservir")) return "Transferencia";
  if (t.includes("tarjeta") || t.includes("datafono") || t.includes("dat\u00e1fono")) return "Tarjeta";
  return String(valor).trim();
}

// ------------------------------------------------------------
// Helpers del pedido
// ------------------------------------------------------------

function normalizarTextoItemPedido(item) {
  return String(item || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function extraerSoloItemsNuevos(baseItems = [], nuevosItems = []) {
  const baseLimpio = (baseItems || []).map((item) => String(item || "").trim()).filter(Boolean);
  const nuevosLimpio = (nuevosItems || []).map((item) => String(item || "").trim()).filter(Boolean);
  if (!baseLimpio.length || !nuevosLimpio.length) return nuevosLimpio;
  const baseNorm = baseLimpio.map(normalizarTextoItemPedido);
  const nuevosNorm = nuevosLimpio.map(normalizarTextoItemPedido);
  const nuevoIncluyeBaseComoPrefijo = nuevosNorm.length >= baseNorm.length && baseNorm.every((item, index) => nuevosNorm[index] === item);
  if (nuevoIncluyeBaseComoPrefijo) return nuevosLimpio.slice(baseLimpio.length);
  return nuevosLimpio;
}

function fusionarPedidoSinDuplicados(base = [], nuevos = []) {
  const salida = [...(base || [])];
  const vistos = new Set(salida.map((item) => normalizarTextoItemPedido(item)));
  for (const item of nuevos || []) {
    const limpio = String(item || "").trim();
    if (!limpio) continue;
    const clave = normalizarTextoItemPedido(limpio);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(limpio);
  }
  return salida;
}

function combinarDatos(base = {}, nuevos = {}) {
  const pedidoBase = Array.isArray(base.pedidoItems) ? base.pedidoItems : [];
  const pedidoNuevoOriginal = Array.isArray(nuevos.pedidoItems) ? nuevos.pedidoItems : [];
  const puedeAcumularPedido = pedidoNuevoOriginal.length > 0 && (base.pasoInternoDomicilio === "capturando_pedido" || base.pasoInternoDomicilio === "pedido_listo_para_confirmar" || (base.nombre && base.direccion));
  const pedidoNuevo = puedeAcumularPedido ? extraerSoloItemsNuevos(pedidoBase, pedidoNuevoOriginal) : pedidoNuevoOriginal;
  return {
    ...base,
    ...nuevos,
    pedidoItems: puedeAcumularPedido ? [...pedidoBase, ...pedidoNuevo] : pedidoNuevo.length > 0 ? pedidoNuevo : pedidoBase
  };
}

// ------------------------------------------------------------
// Parseo de formularios
// ------------------------------------------------------------

function normalizarTextoEtiqueta(valor) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}

function limpiarLineaFormulario(linea) {
  return String(linea || "").replace(/^[\s\-\u2022*\u00b7\u25aa\u25e6\u25cf\u25cb\u25c6\u25c7\u30fb]+/, "").trim();
}

function extraerValorEtiqueta(texto, etiquetas) {
  const lineas = String(texto || "").split(/\r?\n/).map((linea) => limpiarLineaFormulario(linea)).filter(Boolean);
  const etiquetasNormalizadas = etiquetas.map((etiqueta) => normalizarTextoEtiqueta(etiqueta));
  for (const linea of lineas) {
    const indiceDosPuntos = linea.indexOf(":");
    if (indiceDosPuntos === -1) continue;
    const claveOriginal = linea.slice(0, indiceDosPuntos).trim();
    const valorOriginal = linea.slice(indiceDosPuntos + 1).trim();
    const claveNormalizada = normalizarTextoEtiqueta(claveOriginal);
    if (etiquetasNormalizadas.includes(claveNormalizada)) return valorOriginal || null;
  }
  return null;
}

function extraerNombreDeEncabezado(texto) {
  const primeraLinea = String(texto || "").split(/\r?\n/)[0] || "";
  // Captura: "Hola, soy Andrey." o "Hola soy andrey quiero reservar..."
  const match = primeraLinea.match(/hola[,\s]+soy\s+([A-Za-záéíóúÁÉÍÓÚñÑ]+)/i);
  if (match) return match[1].trim();
  return null;
}

function extraerFormularioReserva(texto) {
  const fecha = extraerValorEtiqueta(texto, ["FECHA"]);
  const hora = extraerValorEtiqueta(texto, ["HORA"]);
  const personas = extraerValorEtiqueta(texto, ["N\u00b0 ASISTENTES", "N\u00ba ASISTENTES", "ASISTENTES", "PERSONAS"]);
  const zona = extraerValorEtiqueta(texto, ["UBICACI\u00d3N", "UBICACION"]);
  const nombre = extraerValorEtiqueta(texto, ["NOMBRE"]) || extraerNombreDeEncabezado(texto);
  const celular = extraerValorEtiqueta(texto, ["CELULAR", "CONTACTO", "TEL\u00c9FONO", "TELEFONO"]);
  const observaciones = extraerValorEtiqueta(texto, ["OBSERVACIONES", "OBSERVACION"]);
  const menuReserva = extraerValorEtiqueta(texto, ["MEN\u00da", "MENU"]);
  return {
    fecha_texto: fecha || null,
    hora: hora || null,
    personas: personas ? Number(String(personas).match(/\d+/)?.[0] || 0) || null : null,
    zona: zona || null,
    nombre: nombre || null,
    celular: celular || null,
    observaciones: observaciones || null,
    menu_reserva: menuReserva || null
  };
}

function esNumeroTelefono(linea) {
  return /^[\d\s\-]{7,13}$/.test(linea.trim()) && linea.replace(/\D/g, "").length >= 7;
}

function esFormaPagoLibre(linea) {
  const t = linea.trim().toLowerCase();
  return t.includes("efectivo") || t.includes("transferencia") || t.includes("nequi") || t.includes("bancolombia") || t.includes("daviplata") || t.includes("crediservir") || t.includes("tarjeta") || t.includes("datafono") || t.includes("dat\u00e1fono") || t.includes("cash");
}

function esDireccionLibre(linea) {
  const t = linea.trim().toLowerCase();
  return t.includes("#") || t.includes("calle") || t.includes("carrera") || t.includes("cra") || /\bcr\s/.test(t) || t.includes("avenida") || t.includes(" av ") || t.includes("diag") || t.includes("transversal") || t.includes("trans") || t.includes("barrio") || /\d+\s*[a-z]?\s*[#\-]\s*\d+/.test(t);
}

function extraerDomicilioLibre(texto) {
  const lineas = String(texto || "").split(/[\r\n,]+/).map((l) => l.replace(/^[\s\-\u2022*\u00b7\u25aa]+/, "").trim()).filter(Boolean);
  let nombre = null, contacto = null, direccion = null, formaPago = null;
  for (const linea of lineas) {
    if (!contacto && esNumeroTelefono(linea)) { contacto = linea.replace(/\s+/g, "").trim(); continue; }
    if (!formaPago && esFormaPagoLibre(linea)) { formaPago = linea.trim(); continue; }
    if (!direccion && esDireccionLibre(linea)) { direccion = linea.trim(); continue; }
    if (!nombre && /^[a-zA-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00e1\u00e9\u00ed\u00f3\u00fa\u00d1\u00f1\s]{2,}$/.test(linea.trim()) && linea.trim().length >= 2) {
      const esItemMenu = parsearPedidoConMenu(linea).some((i) => i.categoria !== "otro");
      if (!esItemMenu) { nombre = linea.trim(); continue; }
    }
  }
  return { nombre: nombre || null, contacto: contacto || null, direccion: direccion || null, formaPago: formaPago || null };
}

function extraerFormularioDomicilio(texto) {
  const nombre = extraerValorEtiqueta(texto, ["NOMBRE"]);
  const contacto = extraerValorEtiqueta(texto, ["CONTACTO", "CELULAR"]);
  const direccion = extraerValorEtiqueta(texto, ["DIRECCI\u00d3N", "DIRECCION"]);
  const formaPago = extraerValorEtiqueta(texto, ["FORMA DE PAGO", "PAGO"]);
  if (nombre || contacto || direccion || formaPago) return { nombre: nombre || null, contacto: contacto || null, direccion: direccion || null, formaPago: formaPago || null };
  return extraerDomicilioLibre(texto);
}

function limpiarDatosExtraidos(datos = {}) {
  const limpio = {};
  for (const [clave, valor] of Object.entries(datos || {})) {
    if (clave === "pedidoItems") {
      if (Array.isArray(valor)) {
        const items = valor.map((i) => String(i || "").trim()).filter(Boolean);
        if (items.length) limpio.pedidoItems = items;
      }
      continue;
    }
    if (valor === null || valor === undefined) continue;
    if (typeof valor === "string" && !valor.trim()) continue;
    limpio[clave] = valor;
  }
  return limpio;
}

// ------------------------------------------------------------
// Enriquecimiento de datos reserva / domicilio
// ------------------------------------------------------------

function enriquecerDatosReservaDesdeTexto(mensaje, sesion, datos = {}) {
  const raw = (mensaje || "").trim();
  const lower = raw.toLowerCase();
  const enriquecidos = { ...datos };
  if (!enriquecidos.zona) { const zona = normalizarZona(raw); if (zona) enriquecidos.zona = zona; }
  if (!enriquecidos.fecha_texto && !enriquecidos.fecha_iso) {
    const fecha = normalizarFechaNatural(raw);
    if (fecha.valido) { enriquecidos.fecha_texto = raw; enriquecidos.fecha_iso = fecha.fechaISO; }
  }
  if (!enriquecidos.hora) { const hora = validarHoraReserva(raw); if (hora.valido) enriquecidos.hora = hora.valorNormalizado; }
  if (!enriquecidos.personas) {
    if (/^\d+$/.test(raw)) {
      const personas = validarCantidadPersonas(raw);
      if (personas.valido) enriquecidos.personas = personas.valorNormalizado;
    } else {
      const match = raw.match(/\b(\d{1,2})\b/);
      if (match && /persona|personas|asistentes|somos|para/i.test(lower)) {
        const personas = validarCantidadPersonas(match[1]);
        if (personas.valido) enriquecidos.personas = personas.valorNormalizado;
      }
    }
  }
  // Celular: número de teléfono enviado como respuesta directa
  if (!enriquecidos.celular) {
    const rawSinEspacios = raw.replace(/[\s\-]/g, "");
    if (/^3\d{9}$/.test(rawSinEspacios)) {
      enriquecidos.celular = rawSinEspacios;
    }
  }
  // Celular: numero de telefono enviado como respuesta directa
  if (!enriquecidos.celular) {
    const rawSinEspacios = raw.replace(/[\s\-]/g, "");
    if (/^3\d{9}$/.test(rawSinEspacios)) {
      enriquecidos.celular = rawSinEspacios;
    }
  }
  const plan = normalizarDecoracionLocal(raw);
  if (plan) { enriquecidos.decoracion = plan; enriquecidos.decoracionDecidida = true; }
  if (lower.includes("sin decoracion") || lower.includes("sin decoraci\u00f3n")) { enriquecidos.decoracion = null; enriquecidos.decoracionDecidida = true; }
  if (!enriquecidos.nombre && pareceNombre(raw) && (sesion.data?.zona || sesion.data?.hora || sesion.data?.personas || enriquecidos.zona || enriquecidos.hora || enriquecidos.personas)) {
    enriquecidos.nombre = raw;
  }
  return enriquecidos;
}

function enriquecerDatosDomicilioDesdeTexto(mensaje, sesion, datos = {}) {
  const raw = (mensaje || "").trim();
  const enriquecidos = { ...datos };
  const nombreSesion = sesion.data?.nombre || null;
  const direccionSesion = sesion.data?.direccion || null;
  const contactoSesion = sesion.data?.contacto || null;
  const formaPagoSesion = sesion.data?.formaPago || null;
  const formularioCompleto = (nombreSesion || enriquecidos.nombre) && (contactoSesion || enriquecidos.contacto) && (direccionSesion || enriquecidos.direccion) && (formaPagoSesion || enriquecidos.formaPago);
  if (formularioCompleto && !esTextoConfirmacionPedido(raw) && !esTextoAgregarPedido(raw) && !esTextoVaciarPedido(raw) && !esTextoModificarPedido(raw) && !extraerTextoQuitarPedido(raw)) {
    const itemsParseados = parsearPedidoConMenu(raw);
    if (itemsParseados.length > 0) enriquecidos.pedidoItems = itemsParseados.map((item) => item.texto);
  }
  return enriquecidos;
}

function noHayDatosReservaDetectados(data = {}) {
  return !data.zona && !data.fecha_iso && !data.fecha_texto && !data.hora && !data.personas && !data.nombre && !data.observaciones;
}

// ------------------------------------------------------------
// MANEJADOR PRINCIPAL
// ------------------------------------------------------------

async function manejarMensaje({ telefono, jid, mensaje }) {
  const textoPlano = (mensaje || "").trim();
  const texto = textoPlano.toLowerCase();
  const sesion = obtenerSesion(telefono);

  actualizarSesion(telefono, { data: { _ultimaInteraccionAt: Date.now() } });

  if (texto === "cancelar" || texto === "salir" || texto === "terminar") {
    resetSesion(telefono);
    return "He cancelado el proceso actual. Escribe *menu* para comenzar de nuevo.";
  }

  if (esSaludoSimple(texto)) {
    resetSesion(telefono);
    const cierreRestaurante = verificarCierreRestaurante();
    if (cierreRestaurante.cerrado) {
      return cierreRestaurante.tipo === "lunes" ? mensajeLunesCerrado() : mensajeRestauranteCerrado();
    }
    if (yaFueSaludado(telefono)) {
      return "\u00bfEn qu\u00e9 te puedo ayudar? \ud83d\ude0a\n\n\ud83e\udea1 *1.* Reservar mesa\n\ud83d\udeb5 *2.* Pedir a domicilio\n\ud83d\udccb *3.* Ver la carta\n\ud83c\udf89 *4.* Decoraciones para eventos";
    }
    registrarSaludo(telefono);
    return "\uD83C\uDF7D\uFE0F \u00a1Hola! Bienvenido a *Zagrada*\nAgradecemos siempre tu apoyo \uD83D\uDE4F\uD83C\uDFFF\n\n\u00bfEn qu\u00e9 te puedo ayudar hoy?\n\n\uD83E\uDEA1 *1.* Reservar mesa\n\uD83D\uDEB5 *2.* Pedir a domicilio\n\uD83D\uDCCB *3.* Ver la carta\n\uD83C\uDF89 *4.* Decoraciones para eventos";
  }

  if (esSolicitudReservaDirecta(texto) && sesion.paso !== "flujo_ia_reserva") {
    actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { decoracionDecidida: false, pasoInternoReserva: "esperando_formulario_reserva" } });
    return crearFormularioReservaTexto(telefono);
  }

  if (esSolicitudDomicilioDirecta(texto) && sesion.paso !== "flujo_ia_domicilio") {
    const cierreDomi1 = verificarCierreRestaurante();
    if (cierreDomi1.cerrado) return mensajeCierreParaDomicilio(cierreDomi1.tipo);
    const domiciliosActivos1 = obtenerConfig("domicilios_activos") || "on";
    if (domiciliosActivos1 !== "on") return mensajeDomicilioNoDisponible();
    actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: { pedidoItems: [], pasoInternoDomicilio: "esperando_formulario_domicilio" } });
    return crearFormularioDomicilioTexto(telefono);
  }

  if (sesion.paso === "esperando_plan_decoracion_menu") {
    if (texto === "ver todos los planes" || texto === "ver todos" || texto === "todos los planes") {
      return {
        tipo: "galeria_planes",
        texto: "Aqu\u00ed tienes nuestros 3 planes de decoraci\u00f3n \u2728" + NOTA_DECORACION,
        imagenes: [
          { path: path.join(__dirname, "../../assets/decoracion/plata.jpg"), caption: "\uD83E\uDD48 Plan Plata \u2014 $60.000" },
          { path: path.join(__dirname, "../../assets/decoracion/oro.jpg"), caption: "\uD83E\uDD47 Plan Oro \u2014 $70.000" },
          { path: path.join(__dirname, "../../assets/decoracion/diamante.jpg"), caption: "\uD83D\uDC8E Plan Diamante \u2014 $80.000" }
        ]
      };
    }
    const plan = obtenerPlanDecoracion(textoPlano, true);
    if (plan) { actualizarSesion(telefono, { paso: "viendo_plan_decoracion", data: { decoracion: plan } }); return crearRespuestaPlan(plan); }
    return "No entend\u00ed qu\u00e9 plan deseas ver.\n\nEscr\u00edbeme:\n- 1 o plata\n- 2 o oro\n- 3 o diamante\n- o ver todos los planes";
  }

  if (sesion.paso === "viendo_plan_decoracion") {
    const planActual = sesion.data.decoracion;
    if (esRespuestaAfirmativa(texto) || texto.includes("reservar")) {
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { decoracion: planActual, decoracionDecidida: true, pasoInternoReserva: "esperando_formulario_reserva" } });
      return crearFormularioReservaTexto(telefono);
    }
    const otroPlan = obtenerPlanDecoracion(textoPlano, true);
    if (otroPlan) { actualizarSesion(telefono, { paso: "viendo_plan_decoracion", data: { decoracion: otroPlan } }); return crearRespuestaPlan(otroPlan); }
    return "Si deseas este plan, puedes escribir:\n- quiero esa\n- esa me gusta\n- reservar con esa\n\nO tambi\u00e9n puedes escribir:\n- plata\n- oro\n- diamante\n- ver todos los planes";
  }

  if (texto === "1" || texto === "reservar" || texto === "reserva" || texto === "reservar mesa") {
    actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { decoracionDecidida: false, pasoInternoReserva: "esperando_formulario_reserva" } });
    return crearFormularioReservaTexto(telefono);
  }

  if (texto === "2" || texto === "carta" || texto === "ver carta") {
    const prefijoCarta1 = saludoPrefijo(telefono);
    if (prefijoCarta1) registrarSaludo(telefono);
    resetSesion(telefono);
    return { texto: prefijoCarta1 + "Aqu\u00ed tienes nuestra carta \uD83D\uDCC4", documentoPath: path.join(__dirname, "../../assets/Carta-Zagrada.pdf"), nombreArchivo: "Carta-Zagrada.pdf" };
  }

  if (texto === "3" || texto === "domicilio" || texto === "domi" || texto === "pedido" || texto === "pedir domicilio") {
    const cierreOp3 = verificarCierreRestaurante();
    if (cierreOp3.cerrado) return mensajeCierreParaDomicilio(cierreOp3.tipo);
    const domiciliosActivosOp3 = obtenerConfig("domicilios_activos") || "on";
    if (domiciliosActivosOp3 !== "on") return mensajeDomicilioNoDisponible();
    actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: { pedidoItems: [], pasoInternoDomicilio: "esperando_formulario_domicilio" } });
    return crearFormularioDomicilioTexto(telefono);
  }

  if (texto === "4" || texto === "decoracion" || texto === "decoraci\u00f3n" || texto === "decoraciones" || texto === "planes de decoracion" || texto === "planes de decoraci\u00f3n") {
    actualizarSesion(telefono, { paso: "esperando_plan_decoracion_menu", data: {} });
    return "Estos son nuestros planes de decoraci\u00f3n \u2728\n\n\uD83E\uDD48 1. Plata \u2014 $60.000\n\uD83E\uDD47 2. Oro \u2014 $70.000\n\uD83D\uDC8E 3. Diamante \u2014 $80.000\n\nEscr\u00edbeme:\n- 1 o plata\n- 2 o oro\n- 3 o diamante\n- o ver todos los planes" + NOTA_DECORACION;
  }

  if (mencionaPlatoEvento(texto)) {
    return "S\u00ed, en Zagrada contamos con opci\u00f3n de plato para evento \uD83C\uDF7D\uFE0F\n\nSi deseas esa opci\u00f3n, puedes continuar con tu reserva normalmente y en observaciones indicar que deseas plato para evento.\n\nNuestro equipo te brindar\u00e1 la informaci\u00f3n completa y te ayudar\u00e1 a definir los detalles.";
  }

  // IA hibrida
  let tipoForzado = null;
  if (sesion.paso === "flujo_ia_reserva") tipoForzado = "reserva";
  if (sesion.paso === "flujo_ia_domicilio") tipoForzado = "domicilio";

  const analisis = await extraerIntencionYDatos({ mensaje: textoPlano, sesionActual: sesion.data || {}, tipoForzado });

  let tipoDetectado = analisis.tipo || "otra_consulta";
  if (tipoDetectado === "otra_consulta") {
    if (sesion.paso === "flujo_ia_reserva") tipoDetectado = "reserva";
    else if (sesion.paso === "flujo_ia_domicilio") tipoDetectado = "domicilio";
    else if (texto.includes("reserva") || texto.includes("reservar")) tipoDetectado = "reserva";
    else if (texto.includes("domicilio") || texto.includes("domi") || texto.includes("pedido")) tipoDetectado = "domicilio";
  }

  if (tipoDetectado === "carta") {
    const prefijoCarta2 = saludoPrefijo(telefono);
    if (prefijoCarta2) registrarSaludo(telefono);
    resetSesion(telefono);
    return { texto: prefijoCarta2 + "Aqu\u00ed tienes nuestra carta \uD83D\uDCC4", documentoPath: path.join(__dirname, "../../assets/Carta-Zagrada.pdf"), nombreArchivo: "Carta-Zagrada.pdf" };
  }

  if (tipoDetectado === "decoracion") {
    actualizarSesion(telefono, { paso: "esperando_plan_decoracion_menu", data: {} });
    return "Estos son nuestros planes de decoraci\u00f3n \u2728\n\n\uD83E\uDD48 1. Plata \u2014 $60.000\n\uD83E\uDD47 2. Oro \u2014 $70.000\n\uD83D\uDC8E 3. Diamante \u2014 $80.000\n\nEscr\u00edbeme:\n- 1 o plata\n- 2 o oro\n- 3 o diamante\n- o ver todos los planes" + NOTA_DECORACION;
  }

  let datosExtraidos = limpiarDatosExtraidos(analisis.datos || {});

  if (tipoDetectado === "reserva") {
    const datosFormulario = extraerFormularioReserva(textoPlano);
    datosExtraidos = { ...datosExtraidos, ...limpiarDatosExtraidos(datosFormulario) };
    // Si la IA puso el teléfono en contacto, mapearlo a celular
    if (datosExtraidos.contacto && !datosExtraidos.celular) {
      datosExtraidos.celular = datosExtraidos.contacto;
      delete datosExtraidos.contacto;
    }
    // Si la IA puso el telefono en contacto, mapearlo a celular
    if (datosExtraidos.contacto && !datosExtraidos.celular) {
      datosExtraidos.celular = datosExtraidos.contacto;
      delete datosExtraidos.contacto;
    }
    datosExtraidos = enriquecerDatosReservaDesdeTexto(textoPlano, sesion, datosExtraidos);
  }

  if (tipoDetectado === "domicilio") {
    const datosFormulario = extraerFormularioDomicilio(textoPlano);
    datosExtraidos = { ...datosExtraidos, ...limpiarDatosExtraidos(datosFormulario) };
    datosExtraidos = enriquecerDatosDomicilioDesdeTexto(textoPlano, sesion, datosExtraidos);
    // Evitar que el nombre de un plato del menu quede guardado como nombre del cliente
    if (datosExtraidos.nombre) {
      const esPlato = parsearPedidoConMenu(datosExtraidos.nombre).some((i) => i.categoria !== "otro");
      if (esPlato) delete datosExtraidos.nombre;
    }
  }

  const datosFusionados = combinarDatos(sesion.data || {}, datosExtraidos);

  if (datosFusionados.zona) datosFusionados.zona = normalizarZona(datosFusionados.zona) || datosFusionados.zona;
  if (datosFusionados.decoracion) datosFusionados.decoracion = normalizarDecoracionLocal(datosFusionados.decoracion);
  if (datosFusionados.formaPago) datosFusionados.formaPago = normalizarFormaPago(datosFusionados.formaPago);
  if (datosFusionados.fecha_texto && !datosFusionados.fecha_iso) {
    const fechaNormalizada = normalizarFechaNatural(datosFusionados.fecha_texto);
    if (fechaNormalizada.valido) { datosFusionados.fecha_iso = fechaNormalizada.fechaISO; datosFusionados.fecha_texto = fechaNormalizada.fechaTexto; }
  }

  // ==========================================================
  // FLUJO RESERVA
  // ==========================================================
  if (tipoDetectado === "reserva") {
    const pasoInternoReserva = sesion.data?.pasoInternoReserva || null;
    const vieneDeFormularioReserva = pasoInternoReserva === "esperando_formulario_reserva";

    if (vieneDeFormularioReserva && noHayDatosReservaDetectados(datosFusionados)) {
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...sesion.data, pasoInternoReserva: "esperando_formulario_reserva" } });
      return crearFormularioReservaTexto(telefono);
    }


    if (pasoInternoReserva === "eligiendo_decoracion") {
      const plan = obtenerPlanDecoracion(textoPlano, true);
      if (plan) {
        const datosActualizados = { ...sesion.data, decoracion: plan, decoracionDecidida: true, pasoInternoReserva: "esperando_observaciones" };
        actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosActualizados });
        return preguntaObservacionesReserva();
      }
      if (esRespuestaNegativa(texto)) {
        const datosActualizados = { ...sesion.data, decoracion: null, decoracionDecidida: true, pasoInternoReserva: "esperando_observaciones" };
        actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosActualizados });
        return preguntaObservacionesReserva();
      }
      if (texto.includes("decoracion") || texto.includes("decoraci\u00f3n")) {
        return "Para agregar decoraci\u00f3n elige uno de nuestros planes:\n- 1 o *plata*\n- 2 o *oro*\n- 3 o *diamante*\n\nPuedes indicar colores o preferencias en el paso de confirmaci\u00f3n.\n\nSi no deseas decoraci\u00f3n escribe *no*." + NOTA_DECORACION;
      }
      return crearGaleriaDecoracionReserva();
    }

    if (pasoInternoReserva === "esperando_observaciones") {
      const obs = esRespuestaNegativa(texto) ? null : textoPlano;
      const datosActualizados = { ...sesion.data, observaciones: obs, pasoInternoReserva: "preguntando_menu" };
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosActualizados });
      return "\u00bfYa tienen pensado los platos o el men\u00fa? \ud83c\udf7d\ufe0f\n\nPuedes indicarlos aqu\u00ed, o escribe *no* si los eligen en el restaurante.";
    }

    if (pasoInternoReserva === "preguntando_menu") {
      const menuResp = esRespuestaNegativa(texto) ? null : textoPlano;
      const datosConMenu = { ...sesion.data, menu_reserva: menuResp, pasoInternoReserva: "confirmando_reserva" };
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosConMenu });
      return crearResumenReserva(datosConMenu);
    }

    if (pasoInternoReserva === "confirmando_reserva") {
      if (texto.includes("decoracion") || texto.includes("decoraci\u00f3n") || obtenerPlanDecoracion(textoPlano, true)) {
        actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...sesion.data, pasoInternoReserva: "eligiendo_decoracion" } });
        return crearGaleriaDecoracionReserva();
      }
      if (esRespuestaAfirmativa(texto)) {
        const dataFinal = { ...sesion.data };
        resetSesion(telefono);
        return procesarReserva({ telefono, jid, data: dataFinal });
      }
      if (esRespuestaNegativa(texto)) {
        actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...sesion.data, pasoInternoReserva: "corrigiendo_reserva" } });
        return "Perfecto, no la guardar\u00e9 todav\u00eda.\n\nEscr\u00edbeme el dato que deseas corregir. Por ejemplo:\n- cambiar hora a 7 pm\n- somos 6 personas\n- nombre Sebastian\n- quiero decoraci\u00f3n\n- cambiar observaciones";
      }
      return "Por favor resp\u00f3ndeme:\n- s\u00ed\n- no";
    }

    if (pasoInternoReserva === "corrigiendo_reserva") {
      // Aplicar correcciones sin pasar por IA (evita sobreescribir campos)
      const corrs = {};
      // Hora directa
      const { validarHoraReserva } = require("../validators/reserva");
      const mHora = textoPlano.match(/(?:cambiar?\s+hora\s+(?:a\s+)?|hora[:\s]+|la\s+hora\s+(?:es\s+)?)(.+)/i);
      if (mHora) { const vh = validarHoraReserva(mHora[1].trim()); if (vh.valido) corrs.hora = vh.valorNormalizado; }
      if (!corrs.hora) { const vh2 = validarHoraReserva(textoPlano.trim()); if (vh2.valido) corrs.hora = vh2.valorNormalizado; }
      // Personas
      const { validarCantidadPersonas } = require("../validators/reserva");
      const mPers = textoPlano.match(/(?:somos\s+|para\s+|cambiar\s+(?:a\s+)?)?([1-9]\d?)\s*(?:personas|asistentes|pax)/i);
      if (mPers) { const vp = validarCantidadPersonas(mPers[1]); if (vp.valido) corrs.personas = vp.valorNormalizado; }
      // Zona
      const zonaCorr = normalizarZona(textoPlano);
      if (zonaCorr) corrs.zona = zonaCorr;
      // Decoracion
      const planCorr = obtenerPlanDecoracion(textoPlano, true);
      if (planCorr) { corrs.decoracion = planCorr; corrs.decoracionDecidida = true; }
      if (texto.includes("sin decorac") || texto === "no decorac") { corrs.decoracion = null; corrs.decoracionDecidida = true; }
      // Nombre
      const mNombre = textoPlano.match(/(?:nombre\s+(?:a\s+)?|a\s+nombre\s+de\s+|cambiar\s+nombre\s+(?:a\s+)?)([a-zA-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00e1\u00e9\u00ed\u00f3\u00fa\u00d1\u00f1 ]{2,})/i);
      if (mNombre) corrs.nombre = mNombre[1].trim();
      // Observaciones
      if (texto.includes("observaci")) { corrs.observaciones = esRespuestaNegativa(texto) ? null : textoPlano; }
      // Menu
      if (texto.includes("menu") || texto.includes("men\u00fa") || texto.includes("plato")) {
        actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...sesion.data, pasoInternoReserva: "preguntando_menu" } });
        return "\u00bfYa tienen pensado los platos o el men\u00fa? \ud83c\udf7d\ufe0f\n\nPuedes indicarlos aqu\u00ed, o escribe *no* si los eligen en el restaurante.";
      }
      if (Object.keys(corrs).length > 0) {
        const datosCorr = { ...sesion.data, ...corrs, pasoInternoReserva: "confirmando_reserva" };
        actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosCorr });
        return crearResumenReserva(datosCorr);
      }
      return "No logr\u00e9 identificar qu\u00e9 dato corregir \ud83e\udd14\n\nEscr\u00edbeme por ejemplo:\n- *cambiar hora a 7 pm*\n- *somos 4 personas*\n- *nombre Andrea*\n- *terraza* o *sal\u00f3n*\n- *decoraci\u00f3n*\n- *cambiar observaciones*";
    }

    if (datosFusionados.hora) {
      const validacionHora = validarHoraReserva(datosFusionados.hora);
      if (!validacionHora.valido) { actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosFusionados }); return validacionHora.error; }
      datosFusionados.hora = validacionHora.valorNormalizado;
    }

    if (datosFusionados.personas) {
      const validacionPersonas = validarCantidadPersonas(String(datosFusionados.personas));
      if (!validacionPersonas.valido) { actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosFusionados }); return validacionPersonas.error; }
      datosFusionados.personas = validacionPersonas.valorNormalizado;
    }

    // Validar que la fecha de reserva no sea lunes
    if (datosFusionados.fecha_iso) {
      const fechaReserva = new Date(datosFusionados.fecha_iso + 'T12:00:00');
      const esLunesFecha = fechaReserva.getDay() === 1;
      const lunesLaborableReserva = obtenerConfig('lunes_laborable') || 'off';
      if (esLunesFecha && lunesLaborableReserva !== 'on') {
        const datosCorregidos = { ...datosFusionados };
        delete datosCorregidos.fecha_iso;
        delete datosCorregidos.fecha_texto;
        actualizarSesion(telefono, { paso: 'flujo_ia_reserva', data: datosCorregidos });
        return 'Los dias lunes no laboramos, por lo que no podemos tomar reservas para ese dia.\n\nPor favor ind\u00edcame otra fecha para tu reserva.';
      }
    }

    const faltantes = calcularFaltantesReserva(datosFusionados);
    if (faltantes.length > 0) {
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...datosFusionados, pasoInternoReserva: vieneDeFormularioReserva ? "esperando_formulario_reserva" : datosFusionados.pasoInternoReserva } });
      if (vieneDeFormularioReserva) return preguntaPorFaltante("reserva", faltantes[0], datosFusionados);
      return conSaludoInicial(preguntaPorFaltante("reserva", faltantes[0], datosFusionados), telefono);
    }

    const decoracionDecidida = datosFusionados.decoracionDecidida === true;
    if (!decoracionDecidida) {
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...datosFusionados, pasoInternoReserva: "eligiendo_decoracion", decoracionDecidida: false } });
      return crearGaleriaDecoracionReserva();
    }

    const yaPasoPorObservaciones = Object.prototype.hasOwnProperty.call(datosFusionados, "observaciones");
    if (!yaPasoPorObservaciones) {
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...datosFusionados, pasoInternoReserva: "esperando_observaciones" } });
      return preguntaObservacionesReserva();
    }

    const yaPasoPorMenu = Object.prototype.hasOwnProperty.call(datosFusionados, "menu_reserva");
    if (!yaPasoPorMenu) {
      actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: { ...datosFusionados, pasoInternoReserva: "preguntando_menu" } });
      return "\u00bfYa tienen pensado los platos o el men\u00fa? \ud83c\udf7d\ufe0f\n\nPuedes indicarlos aqu\u00ed, o escribe *no* si los eligen en el restaurante.";
    }

    const datosActualizados = { ...datosFusionados, pasoInternoReserva: "confirmando_reserva" };
    actualizarSesion(telefono, { paso: "flujo_ia_reserva", data: datosActualizados });
    return crearResumenReserva(datosActualizados);
  }

  // ==========================================================
  // FLUJO DOMICILIO
  // ==========================================================
  if (tipoDetectado === "domicilio") {
    if (sesion.paso !== "flujo_ia_domicilio") {
      const cierreIA = verificarCierreRestaurante();
      if (cierreIA.cerrado) return mensajeCierreParaDomicilio(cierreIA.tipo);
      const domiciliosActivosIA = obtenerConfig("domicilios_activos") || "on";
      if (domiciliosActivosIA !== "on") return mensajeDomicilioNoDisponible();
    }

    const pasoInternoDomicilio = sesion.data?.pasoInternoDomicilio || null;

    // Consulta generica
    if (!sesion.data?.nombre && !sesion.data?.direccion && (!Array.isArray(sesion.data?.pedidoItems) || !sesion.data?.pedidoItems.length) && esConsultaDomicilios(textoPlano)) {
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: { pedidoItems: [], pasoInternoDomicilio: "esperando_formulario_domicilio" } });
      return conSaludoInicial("S\u00ed, claro. Para ayudarte con tu domicilio te pido unos datos:\n\n\uD83D\uDEF5 DOMICILIO\n- NOMBRE:\n- CONTACTO:\n- DIRECCI\u00d3N:\n- FORMA DE PAGO:", telefono);
    }

    // Estado: confirmando domicilio
    if (pasoInternoDomicilio === "confirmando_domicilio") {
      if (esRespuestaAfirmativa(texto)) {
        const dataFinal = { ...sesion.data };
        resetSesion(telefono);
        return procesarDomicilio({ telefono, jid, data: dataFinal });
      }
      if (esRespuestaNegativa(texto) || esTextoModificarPedido(texto)) {
        const datosActualizados = { ...sesion.data, pasoInternoDomicilio: "pedido_listo_para_confirmar" };
        actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
        return "Perfecto, no lo guardar\u00e9 todav\u00eda.\n\n" + crearEstadoPedido(datosActualizados);
      }
      return "Por favor resp\u00f3ndeme:\n- s\u00ed\n- no";
    }

    // Estado: esperando observaciones
    if (pasoInternoDomicilio === "esperando_observaciones") {
      if (esTextoModificarPedido(texto) || esTextoVaciarPedido(texto) || esTextoAgregarPedido(texto)) {
        const datosActualizados = {
          ...sesion.data,
          pedidoItems: esTextoVaciarPedido(texto) ? [] : sesion.data.pedidoItems || [],
          pasoInternoDomicilio: esTextoVaciarPedido(texto) ? "capturando_pedido" : "pedido_listo_para_confirmar"
        };
        actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
        if (esTextoVaciarPedido(texto)) return "Listo, vac\u00ed\u00e9 tu pedido. Escr\u00edbeme lo que deseas ordenar.";
        return crearEstadoPedido(datosActualizados);
      }
      const obs = esRespuestaNegativa(texto) ? null : textoPlano;
      const datosActualizados = { ...sesion.data, observaciones: obs, pasoInternoDomicilio: "confirmando_domicilio" };
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
      return crearResumenDomicilio(datosActualizados);
    }

    // Captura / completar formulario
    const nombreActual = sesion.data?.nombre || datosFusionados.nombre || null;
    const contactoActual = sesion.data?.contacto || datosFusionados.contacto || null;
    const direccionActual = sesion.data?.direccion || datosFusionados.direccion || null;
    const formaPagoActual = sesion.data?.formaPago ? sesion.data.formaPago : datosFusionados.formaPago ? normalizarFormaPago(datosFusionados.formaPago) : null;
    // Usar datosFusionados.pedidoItems para preservar items enviados antes de completar el formulario
    const pedidoActual = Array.isArray(datosFusionados?.pedidoItems) ? datosFusionados.pedidoItems : [];

    const datosFormulario = {
      ...sesion.data,
      nombre: tieneNombreValido(nombreActual) ? nombreActual : null,
      contacto: tieneContactoValido(contactoActual) ? contactoActual : null,
      direccion: tieneDireccionValida(direccionActual) ? direccionActual : null,
      formaPago: tieneFormaPagoValida(formaPagoActual) ? formaPagoActual : null,
      pedidoItems: pedidoActual
    };

    const faltantesForm = [];
    if (!datosFormulario.nombre) faltantesForm.push("nombre");
    if (!datosFormulario.contacto) faltantesForm.push("contacto");
    if (!datosFormulario.direccion) faltantesForm.push("direccion");
    if (!datosFormulario.formaPago) faltantesForm.push("formaPago");

    if (faltantesForm.length > 0) {
      const datosActualizados = { ...datosFormulario, pasoInternoDomicilio: "esperando_formulario_domicilio" };
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
      // Si el usuario llega con un item y faltan TODOS los campos, mostrar formulario completo con nota
      if (faltantesForm.length === 4 && pedidoActual.length > 0) {
        const listaItems = pedidoActual.map((i) => "- " + i).join("\n");
        return crearFormularioDomicilioTexto(telefono) + "\n\nYa tengo anotado:\n" + listaItems + " \uD83C\uDF7D\uFE0F";
      }
      return preguntaPorFaltante("domicilio", faltantesForm[0], datosActualizados);
    }

    // Formulario completo - gestionamos pedido

    if (esTextoConfirmacionPedido(texto)) {
      if (!pedidoActual.length) return "Antes de confirmar, por favor escr\u00edbeme al menos un producto para el pedido.";
      const datosActualizados = { ...datosFormulario, pedidoItems: pedidoActual, pasoInternoDomicilio: "esperando_observaciones" };
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
      return preguntaObservacionesDomicilio();
    }

    if (esTextoModificarPedido(texto)) {
      const datosActualizados = { ...datosFormulario, pedidoItems: pedidoActual, pasoInternoDomicilio: "pedido_listo_para_confirmar" };
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
      return crearEstadoPedido(datosActualizados);
    }

    if (esTextoVaciarPedido(texto)) {
      const datosActualizados = { ...datosFormulario, pedidoItems: [], pasoInternoDomicilio: "capturando_pedido" };
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
      return "Listo, vac\u00ed\u00e9 tu pedido. Escr\u00edbeme lo que deseas ordenar.";
    }

    const textoQuitar = extraerTextoQuitarPedido(texto);
    if (textoQuitar) {
      const { pedido: nuevoPedido, eliminados } = quitarItemDelPedido(pedidoActual, textoQuitar);
      const datosActualizados = { ...datosFormulario, pedidoItems: nuevoPedido, pasoInternoDomicilio: nuevoPedido.length ? "pedido_listo_para_confirmar" : "capturando_pedido" };
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
      if (!eliminados.length) return "No encontr\u00e9 \"" + textoQuitar + "\" en tu pedido.\n\n" + crearEstadoPedido(datosActualizados);
      if (!nuevoPedido.length) return "Quit\u00e9: " + eliminados.join(", ") + ".\n\nTu pedido qued\u00f3 vac\u00edo. Escr\u00edbeme lo que deseas ordenar.";
      return "Quit\u00e9: " + eliminados.join(", ") + ".\n\n" + crearEstadoPedido(datosActualizados);
    }

    if (esTextoAgregarPedido(texto)) {
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: { ...datosFormulario, pedidoItems: pedidoActual, pasoInternoDomicilio: "capturando_pedido" } });
      return "Perfecto. Escr\u00edbeme lo que deseas agregar al pedido.";
    }

    // Detectar si este mensaje fue usado para llenar un campo del formulario que faltaba
    const mensajeLlenoFormulario =
      (!sesion.data?.nombre && Boolean(datosFormulario.nombre)) ||
      (!sesion.data?.contacto && Boolean(datosFormulario.contacto)) ||
      (!sesion.data?.direccion && Boolean(datosFormulario.direccion)) ||
      (!sesion.data?.formaPago && Boolean(datosFormulario.formaPago));

    if (mensajeLlenoFormulario) {
      const datosActualizados = { ...datosFormulario, pedidoItems: pedidoActual, pasoInternoDomicilio: pedidoActual.length ? "pedido_listo_para_confirmar" : "capturando_pedido" };
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados });
      if (pedidoActual.length > 0) return crearEstadoPedido(datosActualizados);
      return "Perfecto. Ahora s\u00ed, escr\u00edbeme tu pedido. Puedes enviarlo todo en un solo mensaje o por partes.";
    }

    // Detectar si el cliente mencion\u00f3 una categoria generica sin especificar cual
    const categoriaAmbigua = detectarCategoriaGenerica(textoPlano);
    if (categoriaAmbigua) {
      const listaOpciones = categoriaAmbigua.opciones.map((op) => "- " + op).join("\n");
      actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: { ...datosFormulario, pedidoItems: pedidoActual, pasoInternoDomicilio: pedidoActual.length ? "pedido_listo_para_confirmar" : "capturando_pedido" } });
      return categoriaAmbigua.pregunta + "\n" + listaOpciones;
    }

    const itemsDesdeParser = parsearPedidoConMenu(textoPlano).map((item) => item.texto);
    let itemsDelMensaje = itemsDesdeParser;


    if (!itemsDelMensaje.length && Array.isArray(datosFusionados.pedidoItems)) {
      itemsDelMensaje = datosFusionados.pedidoItems.map((item) => String(item || "").trim()).filter(Boolean);
    }

    if (!itemsDelMensaje.length && textoPlano.length >= 2) {
      itemsDelMensaje = [textoPlano];
    }

    const pedidoActualizado = fusionarPedidoSinDuplicados(pedidoActual, itemsDelMensaje);
    const datosActualizados2 = { ...datosFormulario, pedidoItems: pedidoActualizado, pasoInternoDomicilio: "pedido_listo_para_confirmar" };
    actualizarSesion(telefono, { paso: "flujo_ia_domicilio", data: datosActualizados2 });
    return crearEstadoPedido(datosActualizados2);
  }

  // Fallback: IA abierta
  const respuestaIA = await preguntarIA(textoPlano);
    return conSaludoInicial(respuestaIA + "\n\nTambién puedes escribir:\n1. Reservar\n2. Carta\n3. Domicilio\n4. Decoraciones", telefono);
}

module.exports = { manejarMensaje };
