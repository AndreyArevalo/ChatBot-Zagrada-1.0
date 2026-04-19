const { MENU_ITEMS } = require("../data/menuZagrada");

const NUMEROS = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10
};

const PALABRAS_GENERICAS_PEDIDO = [
  "hamburguesa",
  "hamburguesas",
  "limonada",
  "limonadas",
  "cerveza",
  "cervezas",
  "agua",
  "gaseosa",
  "soda",
  "jugo",
  "jugos",
  "arroz",
  "pasta",
  "pastas",
  "ensalada",
  "ensaladas",
  "parrillada",
  "trucha",
  "salmon",
  "pechuga",
  "lomo",
  "lomito",
  "costilla",
  "costillas",
  "chuleta",
  "nuggets",
  "crispy",
  "maicitos",
  "papas",
  "patacon",
  "patacones"
];

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MENU_INDEXADO = MENU_ITEMS.map((item) => ({
  ...item,
  aliasesNormalizados: [item.nombre, ...(item.aliases || [])].map(normalizarTexto)
}));

function buscarItemMenu(segmento) {
  const segmentoNormalizado = normalizarTexto(segmento);
  let mejor = null;
  let mejorLongitud = 0;
  for (const item of MENU_INDEXADO) {
    for (const alias of item.aliasesNormalizados) {
      if (segmentoNormalizado.includes(alias) && alias.length > mejorLongitud) {
        mejor = item;
        mejorLongitud = alias.length;
      }
    }
  }
  return mejor;
}

function tokenACantidad(token) {
  const t = normalizarTexto(token);
  if (/^\d+$/.test(t)) return Number(t);
  return NUMEROS[t] || 1;
}

function limpiarSegmento(segmento) {
  return String(segmento || "")
    .replace(/^\s*(de|x)\s+/i, "")
    .replace(/^\s*(y|e)\s+/i, "")
    .replace(/\s+y\s*$/i, "")
    .replace(/\s*,\s*$/i, "")
    .trim();
}

function segmentoPareceDireccionOContexto(segmento) {
  const s = normalizarTexto(segmento);
  return (
    s.includes("domicilio") ||
    s.includes("a nombre de") ||
    s.includes("nombre de") ||
    s.includes("calle") ||
    s.includes("carrera") ||
    s.includes("cra") ||
    s.includes("avenida") ||
    s.includes("av ") ||
    s.includes("diag") ||
    s.includes("trans") ||
    s.includes("barrio") ||
    s.includes("#")
  );
}

function segmentoParecePedidoLibre(segmento) {
  const s = normalizarTexto(segmento);
  return PALABRAS_GENERICAS_PEDIDO.some((palabra) => s.includes(palabra));
}

function deduplicarInternamente(items) {
  const vistos = new Set();
  const salida = [];
  for (const item of items) {
    const clave = normalizarTexto(item.texto);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(item);
  }
  return salida;
}

function parsearPedidoConMenu(texto) {
  const raw = String(texto || "").trim();
  if (!raw) return [];

  const matches = [
    ...raw.matchAll(/\b(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/gi)
  ];

  if (matches.length === 0) {
    const item = buscarItemMenu(raw);
    if (item) {
      return [{ cantidad: 1, nombre: item.nombre, categoria: item.categoria, texto: "1 " + item.nombre }];
    }
    if (segmentoParecePedidoLibre(raw) && !segmentoPareceDireccionOContexto(raw)) {
      return [{ cantidad: 1, nombre: raw, categoria: "otro", texto: "1 " + raw }];
    }
    return [];
  }

  const items = [];
  for (let i = 0; i < matches.length; i++) {
    const actual = matches[i];
    const siguiente = matches[i + 1];
    const cantidad = tokenACantidad(actual[0]);
    const inicioSegmento = actual.index + actual[0].length;
    const finSegmento = siguiente ? siguiente.index : raw.length;
    let segmento = raw.slice(inicioSegmento, finSegmento);
    segmento = limpiarSegmento(segmento);
    if (!segmento) continue;
    if (segmentoPareceDireccionOContexto(segmento)) continue;
    const itemMenu = buscarItemMenu(segmento);
    if (itemMenu) {
      items.push({ cantidad, nombre: itemMenu.nombre, categoria: itemMenu.categoria, texto: cantidad + " " + itemMenu.nombre });
      continue;
    }
    if (segmentoParecePedidoLibre(segmento)) {
      items.push({ cantidad, nombre: segmento, categoria: "otro", texto: cantidad + " " + segmento });
    }
  }
  return deduplicarInternamente(items);
}

// ---------------------------------------------------------------------------
// Deteccion de categoria ambigua
// Retorna { categoria, pregunta, opciones } si el texto menciona una categoria
// general sin especificar un item concreto. Retorna null si no hay ambiguedad.
// ---------------------------------------------------------------------------

const CATEGORIAS_AMBIGUAS = [
  {
    triggers: ["hamburguesa", "hamburguesas"],
    categorias: ["hamburguesa"],
    etiqueta: "hamburguesa",
    pregunta: "\u00bfCu\u00e1l hamburguesa deseas? Tenemos:"
  },
  {
    triggers: ["arroz"],
    categorias: ["arroz"],
    etiqueta: "arroz",
    pregunta: "\u00bfCu\u00e1l arroz deseas? Tenemos:",
    excluir: ["arroz blanco", "arroz de coco"]
  },
  {
    triggers: ["pasta", "pastas"],
    categorias: ["pasta"],
    etiqueta: "pasta",
    pregunta: "\u00bfCu\u00e1l pasta deseas? Tenemos:"
  },
  {
    triggers: ["cerveza", "cervezas"],
    categorias: ["cerveza"],
    etiqueta: "cerveza",
    pregunta: "\u00bfCu\u00e1l cerveza deseas? Tenemos:"
  },
  {
    triggers: ["maicito", "maicitos"],
    categorias: ["maicito"],
    etiqueta: "maicito",
    pregunta: "\u00bfCu\u00e1l maicito deseas? Tenemos:"
  },
  {
    triggers: ["papas"],
    categorias: ["papas"],
    etiqueta: "papas",
    pregunta: "\u00bfCu\u00e1les papas deseas? Tenemos:",
    excluir: ["papa criolla", "papa a la francesa"]
  }
];

function detectarCategoriaGenerica(texto) {
  const textoNorm = normalizarTexto(texto);

  for (const cat of CATEGORIAS_AMBIGUAS) {
    const tieneTrigger = cat.triggers.some(function(t) {
      return new RegExp("\\b" + t + "\\b").test(textoNorm);
    });
    if (!tieneTrigger) continue;

    const tieneExclusion = (cat.excluir || []).some(function(ex) {
      return textoNorm.includes(normalizarTexto(ex));
    });
    if (tieneExclusion) continue;

    const itemsCategoria = MENU_INDEXADO.filter(function(i) {
      return cat.categorias.includes(i.categoria);
    });
    const tieneItemEspecifico = itemsCategoria.some(function(item) {
      return item.aliasesNormalizados.some(function(alias) {
        return textoNorm.includes(alias);
      });
    });
    if (tieneItemEspecifico) continue;

    const opciones = itemsCategoria.map(function(i) { return i.nombre; });
    return {
      categoria: cat.etiqueta,
      pregunta: cat.pregunta,
      opciones: opciones
    };
  }

  return null;
}

module.exports = {
  parsearPedidoConMenu: parsearPedidoConMenu,
  normalizarTexto: normalizarTexto,
  detectarCategoriaGenerica: detectarCategoriaGenerica
};
