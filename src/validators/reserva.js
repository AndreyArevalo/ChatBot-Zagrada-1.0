function tieneContenidoUtil(texto) {
  return /[a-zA-Záéíóúñ0-9]/i.test(texto);
}

function validarFechaReserva(valor) {
  const texto = valor.trim().toLowerCase();

  if (!tieneContenidoUtil(texto)) {
    return {
      valido: false,
      error: "Por favor indícame una fecha válida. Ejemplo: mañana, sábado o 25 de abril."
    };
  }

  const palabrasValidas = [
    "hoy",
    "mañana",
    "manana",
    "lunes",
    "martes",
    "miércoles",
    "miercoles",
    "jueves",
    "viernes",
    "sábado",
    "sabado",
    "domingo",
    "pasado mañana"
  ];

  const regexFechaNumerica = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)?(\d{2,4})?$/;
  const regexFechaTexto = /^\d{1,2}\s+de\s+[a-záéíóúñ]+$/i;

  const esPalabraValida = palabrasValidas.includes(texto);
  const esNumericaValida = regexFechaNumerica.test(texto);
  const esTextoValido = regexFechaTexto.test(texto);

  if (!esPalabraValida && !esNumericaValida && !esTextoValido) {
    return {
      valido: false,
      error: "No entendí la fecha. Escríbela así: mañana, sábado, 25/04 o 25 de abril."
    };
  }

  return {
    valido: true,
    valorNormalizado: valor.trim()
  };
}

function validarHoraReserva(valor) {
  const texto = valor.trim().toLowerCase();

  if (!tieneContenidoUtil(texto)) {
    return {
      valido: false,
      error: "Por favor indícame una hora válida. Ejemplo: 7 pm, 8:30 pm o 19:00."
    };
  }

  const regex12h = /^(0?[1-9]|1[0-2])(:[0-5]\d)?\s?(am|pm)$/i;
  const regex24h = /^([01]?\d|2[0-3]):[0-5]\d$/;
  const regexHoraSimple = /^(0?[1-9]|1[0-2])$/;

  if (!regex12h.test(texto) && !regex24h.test(texto) && !regexHoraSimple.test(texto)) {
    return {
      valido: false,
      error: "No entendí la hora. Escríbela así: 7 pm, 8:30 pm o 19:00."
    };
  }

  return {
    valido: true,
    valorNormalizado: valor.trim()
  };
}

function validarCantidadPersonas(valor) {
  const cantidad = parseInt(valor.trim(), 10);

  if (isNaN(cantidad) || cantidad <= 0) {
    return {
      valido: false,
      error: "Por favor indícame un número válido de personas. Ejemplo: 2, 4, 6."
    };
  }

  if (cantidad > 40) {
    return {
      valido: false,
      error: "Para grupos tan grandes, por favor escribe un número menor o consulta directamente con el restaurante."
    };
  }

  return {
    valido: true,
    valorNormalizado: cantidad
  };
}

module.exports = {
  validarFechaReserva,
  validarHoraReserva,
  validarCantidadPersonas
};