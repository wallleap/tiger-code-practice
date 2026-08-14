const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const dataDir = path.join(__dirname, "data");

for (const file of fs.readdirSync(dataDir)) {
  if (!file.endsWith(".txt")) continue;
  const full = path.join(dataDir, file);
  // 统一 LF 行尾再压缩，保证跨平台（Windows 检出为 CRLF）时生成的 .gz 与仓库一致
  const text = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
  const gz = zlib.gzipSync(Buffer.from(text, "utf8"), { level: 9 });
  // gzip 头部 OS 字段统一为 Unix(0x13)，避免 Windows 生成 0x0a 造成无意义差异
  gz[9] = 0x13;
  fs.writeFileSync(full + ".gz", gz);
  console.log(`gzip ${file} (${fs.statSync(full).size} -> ${gz.length})`);
}
