require("dotenv").config();

console.log(
  "OPENROUTER_API_KEY cargada:",
  process.env.OPENROUTER_API_KEY ? "SI" : "NO"
);

const iniciarWhatsApp = require("./whatsapp/baileysClient");
const { iniciarLimpiezaAutomatica } = require("./services/limpiezaDB");

iniciarLimpiezaAutomatica();

iniciarWhatsApp().catch((error) => {
  console.error("Error al iniciar WhatsApp:", error);
});