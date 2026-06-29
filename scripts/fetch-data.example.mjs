import fs from "node:fs";

const sourcePath = new URL("../data.example.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

data.generated_at = new Date().toISOString();
data.source = "Example data refreshed by scripts/fetch-data.example.mjs";

console.log(JSON.stringify(data, null, 2));
