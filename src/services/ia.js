const axios = require("axios");
const { MENU_RESUMEN_IA } = require("../data/menuZagrada");

async function preguntarIA(mensajeUsuario) {
  try {
    const respuesta = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres el asistente virtual del restaurante Zagrada.
Responde corto, claro, amable y profesional.

Menú oficial de Zagrada:
${MENU_RESUMEN_IA}

Reglas importantes:
- No inventes platos, precios, promociones, horarios ni servicios.
- Solo puedes mencionar platos y bebidas del menú oficial listado arriba.
- Si preguntan qué tienen, puedes resumir por categorías o recomendar ver la carta.
- Si no sabes algo, di que el usuario puede escribir "menu" para ver opciones o pedir ayuda.
- Solo orienta al cliente sobre reservas, carta, domicilios y decoraciones.
- Si el mensaje es ambiguo, pide una aclaración breve.
- No afirmes que existe un servicio que no esté confirmado.`
          },
          {
            role: "user",
            content: mensajeUsuario
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Zagrada Bot"
        },
        timeout: 30000
      }
    );

    const contenido = respuesta?.data?.choices?.[0]?.message?.content;

    if (!contenido) {
      console.log("Respuesta inesperada de OpenRouter:", JSON.stringify(respuesta.data, null, 2));
      return "No pude generar una respuesta en este momento.";
    }

    return contenido;
  } catch (error) {
    console.error("Error IA status:", error.response?.status);
    console.error("Error IA data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Error IA message:", error.message);

    return "Lo siento, hubo un problema con la IA. Escribe *menu* para seguir usando el bot.";
  }
}

module.exports = { preguntarIA };