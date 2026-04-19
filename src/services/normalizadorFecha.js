const DIAS_SEMANA = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6
};

const MESES = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11
};

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function inicioDia(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function resolverDiaSemana(nombreDia, baseDate = new Date()) {
  const diaObjetivo = DIAS_SEMANA[nombreDia];
  if (diaObjetivo === undefined) return null;

  const base = inicioDia(baseDate);
  const actual = base.getDay();

  let diff = diaObjetivo - actual;
  if (diff <= 0) diff += 7;

  const resultado = new Date(base);
  resultado.setDate(base.getDate() + diff);
  return resultado;
}

function normalizarFechaNatural(texto, baseDate = new Date()) {
  if (!texto || typeof texto !== "string") {
    return { valido: false, error: "Fecha vacía." };
  }

  const t = texto.trim().toLowerCase()
    .replace(/^(para\s+)?el\s+(pr\u00f3ximo|proximo)\s+/, "")
    .replace(/^(pr\u00f3ximo|proximo)\s+/, "")
    .replace(/^para\s+el\s+/, "")
    .replace(/^el\s+/, "");
  const hoy = inicioDia(baseDate);

  if (t === "hoy") {
    return { valido: true, fechaISO: toISODate(hoy), fechaTexto: texto.trim() };
  }

  if (t === "mañana" || t === "manana") {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 1);
    return { valido: true, fechaISO: toISODate(d), fechaTexto: texto.trim() };
  }

  if (t === "pasado mañana" || t === "pasado manana") {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 2);
    return { valido: true, fechaISO: toISODate(d), fechaTexto: texto.trim() };
  }

  if (DIAS_SEMANA[t] !== undefined) {
    const d = resolverDiaSemana(t, hoy);
    return { valido: true, fechaISO: toISODate(d), fechaTexto: texto.trim() };
  }

  // Formato ISO: YYYY-MM-DD (ej: 2026-04-19)
  const matchISO = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchISO) {
    const d = new Date(Number(matchISO[1]), Number(matchISO[2]) - 1, Number(matchISO[3]));
    if (!isNaN(d.getTime())) {
      return { valido: true, fechaISO: toISODate(d), fechaTexto: texto.trim() };
    }
  }

  const matchNumerica = t.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
  if (matchNumerica) {
    let dia = Number(matchNumerica[1]);
    let mes = Number(matchNumerica[2]) - 1;
    let anio = matchNumerica[3] ? Number(matchNumerica[3]) : hoy.getFullYear();

    if (anio < 100) anio += 2000;

    const d = new Date(anio, mes, dia);
    if (isNaN(d.getTime())) {
      return { valido: false, error: "Fecha inválida." };
    }

    return { valido: true, fechaISO: toISODate(d), fechaTexto: texto.trim() };
  }

  const matchTexto = t.match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)$/i);
  if (matchTexto) {
    const dia = Number(matchTexto[1]);
    const nombreMes = matchTexto[2].toLowerCase();
    const mes = MESES[nombreMes];

    if (mes === undefined) {
      return { valido: false, error: "Mes no reconocido." };
    }

    let anio = hoy.getFullYear();
    let d = new Date(anio, mes, dia);

    if (d < hoy) {
      anio += 1;
      d = new Date(anio, mes, dia);
    }

    return { valido: true, fechaISO: toISODate(d), fechaTexto: texto.trim() };
  }

  return {
    valido: false,
    error: "No pude convertir la fecha a formato real."
  };
}

module.exports = { normalizarFechaNatural };