const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const dataDir = path.join(__dirname, "data");

for (const file of fs.readdirSync(dataDir)) {
  if (!file.endsWith(".txt")) continue;
  const full = path.join(dataDir, file);
  const gz = zlib.gzipSync(fs.readFileSync(full), { level: 9 });
  fs.writeFileSync(full + ".gz", gz);
  console.log(`gzip ${file} (${fs.statSync(full).size} -> ${gz.length})`);
}
