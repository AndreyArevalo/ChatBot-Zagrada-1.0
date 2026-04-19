const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");

async function transcribirAudio(rutaArchivo) {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(rutaArchivo));
    form.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders()
        },
        timeout: 60000
      }
    );

    return response?.data?.text?.trim() || "";
  } catch (error) {
    console.error("Error transcribiendo audio:", error.response?.data || error.message);
    return "";
  }
}

module.exports = { transcribirAudio };