import { loadEvents } from "../src/lib/events";
import { validateEvents } from "../src/lib/schema";

const errors = validateEvents(loadEvents());
if (errors.length) {
  console.error("events.json 校验失败：\n" + errors.join("\n"));
  process.exit(1);
}
console.log("events.json 校验通过");
