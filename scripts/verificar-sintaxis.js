// Verifica la sintaxis de todos los archivos .js de src/ con `node --check`.
// Se usa como etapa de análisis estático en el pipeline.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function listarJs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return listarJs(ruta);
    return e.name.endsWith(".js") ? [ruta] : [];
  });
}

const archivos = listarJs(path.join(__dirname, "..", "src"));
let errores = 0;

for (const archivo of archivos) {
  const r = spawnSync(process.execPath, ["--check", archivo], { encoding: "utf8" });
  if (r.status !== 0) {
    errores++;
    console.error(`✗ ${archivo}\n${r.stderr}`);
  }
}

console.log(`Sintaxis revisada en ${archivos.length} archivos. Errores: ${errores}`);
process.exit(errores ? 1 : 0);
