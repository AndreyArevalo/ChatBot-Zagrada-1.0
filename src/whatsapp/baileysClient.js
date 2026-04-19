const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

const { manejarMensaje } = require("../bot/manejarMensaje");
const { manejarMensajeAdmin } = require("../bot/manejarMensajeAdmin");
const {
  registrarAutoSend,
  fueAutoSendReciente,
  activarHumanoTemporal,
  estaEnHumanoTemporal
} = require("../services/humanOverride");

const logger = P({ level: "silent" });

//const fs = require("fs");
//const path = require("path");
//const { downloadMediaMessage } = require("@whiskeysockets/baileys");
//const { transcribirAudio } = require("../services/transcribirAudio");

function normalizarTelefono(jid) {
  if (!jid) return "";

  return jid
    .split(":")[0]
    .replace("@s.whatsapp.net", "")
    .replace("@lid", "")
    .trim();
}

function construirAdminJids(adminIds) {
  return (adminIds || [])
    .map((id) => `${id}@lid`)
    .filter(Boolean);
}

async function sendTracked(sock, jid, payload) {
  registrarAutoSend(jid, payload);
  return sock.sendMessage(jid, payload);
}

async function iniciarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info_baileys");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ["Zagrada Bot", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\nEscanea este QR con WhatsApp:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "connecting") {
      console.log("Conectando a WhatsApp...");
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado correctamente.");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log("Conexión cerrada. Código:", statusCode);

      if (shouldReconnect) {
        console.log("Reintentando conexión...");
        iniciarWhatsApp();
      } else {
        console.log("Sesión cerrada. Borra auth_info_baileys y vuelve a escanear.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

const msg = messages[0];
if (!msg) return;
if (msg.key.remoteJid === "status@broadcast") return;

const remoteJid = msg.key.remoteJid;

const telefonoSesion =
  normalizarTelefono(msg.key.participant) ||
  normalizarTelefono(msg.key.remoteJid) ||
  "";

const textoMensaje =
  msg.message?.conversation ||
  msg.message?.extendedTextMessage?.text ||
  msg.message?.imageMessage?.caption ||
  msg.message?.videoMessage?.caption ||
  "";

if (msg.key.fromMe) {
  if (!fueAutoSendReciente(remoteJid, textoMensaje)) {
    activarHumanoTemporal(telefonoSesion, 20);
    console.log(`🧑‍💼 Chat en modo humano por 20 min para ${telefonoSesion}`);
  }
  return;
}



    const adminsWhatsapp = (process.env.ADMIN_WHATSAPP || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const esAdmin = adminsWhatsapp.includes(telefonoSesion);
const reservasGroupJid = (process.env.RESERVAS_GROUP_JID || "").trim();

if (!esAdmin && estaEnHumanoTemporal(telefonoSesion)) {
  console.log(`⏸️ Bot pausado temporalmente para ${telefonoSesion}`);
  return;
}

const texto =
  msg.message?.conversation ||
  msg.message?.extendedTextMessage?.text ||
  msg.message?.imageMessage?.caption ||
  msg.message?.videoMessage?.caption ||
  "";

if (!texto || !remoteJid) return;

console.log(`Mensaje recibido de ${remoteJid}: ${texto}`);
console.log("telefonoSesion:", telefonoSesion);
console.log("adminsWhatsapp:", adminsWhatsapp);
console.log("esAdmin:", esAdmin);

try {
      let respuesta;

      if (esAdmin) {
        respuesta = await manejarMensajeAdmin({
          telefono: telefonoSesion,
          mensaje: texto
        });
      } else {
        respuesta = await manejarMensaje({
          telefono: telefonoSesion,
          jid: remoteJid,
          mensaje: texto
        });
      }

      if (!respuesta) return;

      // Línea aprox. 115
      // Respuesta especial desde admin: responder admin y avisar cliente
      if (esAdmin && typeof respuesta === "object" && respuesta.textoAdmin) {
        await sendTracked(sock, remoteJid, { text: respuesta.textoAdmin });

        if (
          respuesta.notificarCliente &&
          respuesta.notificarCliente.jid &&
          respuesta.notificarCliente.texto
        ) {
          await sock.sendMessage(respuesta.notificarCliente.jid, {
            text: respuesta.notificarCliente.texto
          });
        }

        if (
          respuesta.notificarGrupo &&
          respuesta.notificarGrupo.texto &&
          reservasGroupJid
        ) {
          await sock.sendMessage(reservasGroupJid, {
            text: respuesta.notificarGrupo.texto
          });
        }

        return;
      }

      // Línea aprox. 132
      // Respuesta especial desde cliente: responder cliente y avisar admin
      if (!esAdmin && typeof respuesta === "object" && respuesta.textoCliente) {
        await sendTracked(sock, remoteJid, { text: respuesta.textoCliente });

        if (respuesta.notificarAdmin && respuesta.notificarAdmin.texto) {
          const adminJids = construirAdminJids(adminsWhatsapp);

          for (const adminJid of adminJids) {
            await sock.sendMessage(adminJid, {
              text: respuesta.notificarAdmin.texto
            });
          }
        }

        return;
      }

      // Línea aprox. 148
      if (typeof respuesta === "string") {
        await sendTracked(sock, remoteJid, { text: respuesta });
        return;
      }

      if (
        respuesta.texto &&
        !respuesta.documentoPath &&
        !respuesta.imagenPath &&
        !(respuesta.tipo === "galeria_planes" && respuesta.imagenes)
      ) {
        await sendTracked(sock, remoteJid, { text: respuesta.texto });
        return;
      }

      if (respuesta.documentoPath) {
        await sendTracked(sock, remoteJid, {
          document: { url: respuesta.documentoPath },
          mimetype: "application/pdf",
          fileName: respuesta.nombreArchivo || "carta.pdf",
          caption: respuesta.texto || "Aquí tienes el documento"
        });
        return;
      }

      if (respuesta.imagenPath) {
        await sendTracked(sock, remoteJid, {
          image: { url: respuesta.imagenPath },
          caption: respuesta.texto || "Aquí tienes la imagen"
        });
        return;
      }

      if (respuesta.tipo === "galeria_planes" && respuesta.imagenes) {
        if (respuesta.texto) {
          await sendTracked(sock, remoteJid, { text: respuesta.texto });
        }

        for (const imagen of respuesta.imagenes) {
          await sendTracked(sock, remoteJid, {
            image: { url: imagen.path },
            caption: imagen.caption || "Plan de decoración"
          });
        }

        return;
      }
    } catch (error) {
      console.error("Error procesando mensaje:");
      console.error("message:", error.message);
      console.error("stack:", error.stack);
      console.error("full error:", error);

      await sendTracked(sock, remoteJid, {
        text: "Perdón, ocurrió un error procesando tu solicitud. Intenta de nuevo."
      });
    }
  });

  return sock;
}

module.exports = iniciarWhatsApp;