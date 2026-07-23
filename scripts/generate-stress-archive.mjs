import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildImportProposal,
  createStressArchive,
} from "../lib/import-archive.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const conversations = Number(process.argv[2] || 40);
const archive = createStressArchive({ conversations });
const proposal = buildImportProposal(archive);

mkdirSync(join(ROOT, "tmp"), { recursive: true });
const outputPath = join(ROOT, "tmp", "stress-archive.json");
writeFileSync(outputPath, JSON.stringify(archive));

console.log(`Wrote ${outputPath}`);
console.log(
  `${proposal.stats.conversations} conversations · ${proposal.stats.peopleProposed} people · ${proposal.stats.eventsProposed} events proposed`,
);
