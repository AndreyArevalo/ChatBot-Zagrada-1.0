const axios = require("axios");
const { MENU_RESUMEN_IA } = require("../data/menuZagrada");

function limpiarJSON(texto) {
  if (!texto) return null;

  const limpio = texto
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(limpio);
  } catch (error) {
    return null;
  }
}

async function extraerIntencionYDatos({
  mensaje,
  sesionActual = {},
  tipoForzado = null
}) {
  try {
    const hoy = new Date();
    const fechaHoyISO = hoy.toISOString().slice(0, 10);
    const modelo = process.env.OPENROUTER_EXTRACTOR_MODEL || "openai/gpt-4o-mini";

    const promptSistema = `
Eres un extractor de intención y datos para el restaurante Zagrada.

Tu trabajo NO es conversar libremente.
Tu trabajo es devolver SIEMPRE un JSON válido.

Menú oficial de Zagrada:
${MENU_RESUMEN_IA}

Debes detectar una de estas intenciones:
- reserva
- domicilio
- carta
- decoracion
- otra_consulta

REGLA CRÍTICA:
- Si recibes "tipoForzado", debes usar exactamente ese tipo.
- Si "tipoForzado" es "domicilio", NO puedes cambiarlo a reserva.
- Si "tipoForzado" es "reserva", NO puedes cambiarlo a domicilio.

Reglas:
- Devuelve SOLO JSON válido.
- No expliques nada fuera del JSON.
- Si el cliente menciona una fecha natural como "mañana", "hoy", "pasado mañana", "sábado", "viernes", "25 de abril", guárdala en "fecha_texto".
- Si el mensaje viene en formato de ficha o formulario con etiquetas como FECHA:, HORA:, N° ASISTENTES:, UBICACIÓN:, NOMBRE:, CELULAR:, MENÚ:, extrae cada campo correctamente.
- "UBICACIÓN" debe mapearse a "zona".
- "N° ASISTENTES" debe mapearse a "personas".
- "NOMBRE" debe mapearse a "nombre".
- "MENÚ" debe mapearse a "observaciones".
- "CELULAR" puede ignorarse si ya existe el número del chat.
- Si el cliente escribe "Salón principal", normalízalo en "zona" como "Salón principal".
- No inventes datos.
- Si no sabes un dato, déjalo null o vacío.
- Si detectas un nombre propio sencillo (persona), úsalo como "nombre". IMPORTANTE: el campo "nombre" es SOLO para el nombre del cliente (persona), NUNCA pongas ahí el nombre de un plato o producto del menú. Si el mensaje principal es una orden de comida (ej: "quiero una marinera", "una trinidad"), el nombre del plato va en "pedidoItems", NO en "nombre".
- Para pedidos de domicilio, devuelve "pedidoItems" como array de strings.
- Conserva cantidades cuando existan. Ejemplo: "1 patillal y 2 poker" => ["1 Patillal", "2 Póker"].
- Si reconoces un producto del menú, usa el nombre oficial del menú.
- Para decoración, si reconoces plata/oro/diamante, normalízalo como "Plata", "Oro" o "Diamante".
- Para zona, normaliza como "Salón principal" o "Terraza" cuando aplique.
- Si detectas personas, devuélvelo como número.
- Si detectas hora, devuélvela como string.
- Si detectas dirección, devuélvela como string.
- Si detectas una dirección sola dentro de un flujo de domicilio, interprétala como "direccion".
- Si detectas un mensaje que parece pedido de comida dentro de un flujo de domicilio, interprétalo como "pedidoItems".
- Si el usuario pregunta por carta, devuelve tipo "carta".
- Si el usuario pregunta por decoraciones, devuelve tipo "decoracion".
- Si detectas un número de teléfono o celular (10 dígitos, generalmente empieza con 3), ponlo en "contacto".
- Si detectas una forma de pago (efectivo, transferencia, nequi, bancolombia, daviplata, tarjeta, etc.), ponla en "formaPago".
- Si el mensaje contiene varias líneas con datos de domicilio sin etiquetas (como nombre, número, dirección y pago), extrae cada uno en su campo correspondiente.

Formato exacto:
{
  "tipo": "reserva|domicilio|carta|decoracion|otra_consulta",
  "datos": {
    "zona": null,
    "fecha_texto": null,
    "hora": null,
    "personas": null,
    "nombre": null,
    "decoracion": null,
    "observaciones": null,
    "direccion": null,
    "contacto": null,
    "formaPago": null,
    "pedidoItems": []
  },
  "respuesta": "texto corto sugerido para el cliente"
}`.trim();

    const promptUsuario = JSON.stringify(
      {
        fechaActualISO: fechaHoyISO,
        tipoForzado,
        mensaje,
        sesionActual
      },
      null,
      2
    );

    const respuesta = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: modelo,
        messages: [
          { role: "system", content: promptSistema },
          { role: "user", content: promptUsuario }
        ],
        temperature: 0.1
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Zagrada Bot Extractor"
        },
        timeout: 30000
      }
    );

    const contenido = respuesta?.data?.choices?.[0]?.message?.content;
    const json = limpiarJSON(contenido);

    if (!json || typeof json !== "object") {
      return {
        tipo: "otra_consulta",
        datos: {},
        respuesta: "No logré interpretar bien el mensaje. ¿Me lo puedes escribir de nuevo?"
      };
    }

    return {
      tipo: json.tipo || "otra_consulta",
      datos: json.datos || {},
      respuesta: json.respuesta || "Entendido."
    };
  } catch (error) {
    console.error("Error extractor IA:", error.response?.status, error.message);

    return {
      tipo: "otra_consulta",
      datos: {},
      respuesta: "Tuve un problema interpretando el mensaje. ¿Me lo puedes escribir nuevamente?"
    };
  }
}

module.exports = { extraerIntencionYDatos };