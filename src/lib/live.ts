import { unstable_cache } from "next/cache";
import { loadEvents, loadHealth } from "./events";
import { refreshSnapshot } from "./snapshot";

// A shared short cache bounds upstream requests while both page and RSS read
// current data independently of GitHub schedules and deployment completion.
export const loadLiveSnapshot = unstable_cache(
  () => refreshSnapshot(loadEvents(), loadHealth()),
  ["live-reset-snapshot-v1"], { revalidate: 60 },
);
