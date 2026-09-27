import { fetchRemoteEvents, type SourceResult } from "./sources";
import { mergeSourceEvents } from "./sync";
import type { EventsFile, HealthFile } from "./types";

// Reads live announcements without writing to Git or replacing the archive.
export async function refreshSnapshot(
  archive: EventsFile, health: HealthFile,
  fetchRemote: () => Promise<SourceResult> = fetchRemoteEvents,
  now = new Date(),
) {
  try {
    const source = await fetchRemote();
    const { file } = mergeSourceEvents(archive, source, now);
    return { events: file.events, health: {
      lastSuccessAt: now.toISOString(), lastFailureAt: null, lastError: null,
      lastSource: source.source, sourceWarning: source.warning, sourceFetchedAt: source.sourceFetchedAt,
    } satisfies HealthFile };
  } catch (err) {
    return { events: archive.events, health: { ...health, lastFailureAt: now.toISOString(),
      lastError: err instanceof Error ? err.message : String(err), sourceWarning: "无法核对最新公告，当前显示已存档历史。",
    } satisfies HealthFile };
  }
}
