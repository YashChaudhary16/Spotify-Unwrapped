import { PreprocessReport, ProcessedRecord, RawStreamingRecord, preprocessWithReport } from './preprocessing';

export interface ParseProgress {
  stage: 'reading' | 'processing';
  /** Files fully read so far. */
  filesDone: number;
  totalFiles: number;
  /** File currently being read. */
  fileName?: string;
  /** Plays collected (known once all files are read). */
  records?: number;
}

export interface SkippedFile {
  name: string;
  reason: string;
}

export interface ImportResult {
  records: ProcessedRecord[];
  report: PreprocessReport;
  /** Files that were ignored because they aren't extended streaming history. */
  skippedFiles: SkippedFile[];
}

const NOT_HISTORY = "doesn't look like Spotify streaming history";

/** Returns why a parsed file isn't extended streaming history, or null if it is. */
function whyNotHistory(json: unknown): string | null {
  if (!Array.isArray(json)) return NOT_HISTORY;
  const sample = json.find(item => item && typeof item === 'object');
  if (!sample) return null; // empty file — fine, it just adds nothing
  if ('endTime' in sample && 'msPlayed' in sample) {
    return 'is from the basic "Account data" export — Unwrapped needs "Extended streaming history"';
  }
  if (!('ts' in sample) || !('ms_played' in sample)) return NOT_HISTORY;
  return null;
}

const WHERE_TO_LOOK = 'Look for files named Streaming_History_Audio_*.json in your Spotify export.';

/**
 * Reads, validates and preprocesses uploaded files. Runs in the worker (or on the main thread as a fallback).
 * Files that aren't streaming history are skipped (and reported) as long as at least one valid file remains.
 */
export async function parseStreamingFiles(
  files: File[],
  onProgress: (progress: ParseProgress) => void,
  alreadySkipped: SkippedFile[] = []
): Promise<ImportResult> {
  const all: RawStreamingRecord[] = [];
  const skippedFiles: SkippedFile[] = [...alreadySkipped];
  let validFiles = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress({ stage: 'reading', filesDone: i, totalFiles: files.length, fileName: file.name });

    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      skippedFiles.push({ name: file.name, reason: "isn't valid JSON" });
      continue;
    }
    const problem = whyNotHistory(json);
    if (problem) {
      skippedFiles.push({ name: file.name, reason: problem });
      continue;
    }
    validFiles++;
    for (const record of json as RawStreamingRecord[]) all.push(record);
  }

  if (validFiles === 0) {
    const first = skippedFiles[0];
    throw new Error(
      first
        ? `"${first.name}" ${first.reason}${skippedFiles.length > 1 ? ` (and ${skippedFiles.length - 1} other file${skippedFiles.length > 2 ? 's' : ''} had problems too)` : ''}. ${WHERE_TO_LOOK}`
        : `No files to read. ${WHERE_TO_LOOK}`
    );
  }

  onProgress({ stage: 'processing', filesDone: files.length, totalFiles: files.length, records: all.length });
  const { records, report } = preprocessWithReport(all);

  if (records.length === 0) {
    throw new Error(
      report.podcastPlays > 0
        ? `These files only contain podcast or audiobook plays (${report.podcastPlays.toLocaleString()}). Unwrapped currently shows music listening only — try your Streaming_History_Audio_*.json files.`
        : `No plays found in these files. ${WHERE_TO_LOOK}`
    );
  }
  if (!records.some(r => r.hours > 0 && r.master_metadata_track_name)) {
    throw new Error(`These files don't contain any listened tracks (every play is empty or 0 seconds long). ${WHERE_TO_LOOK}`);
  }

  return { records, report, skippedFiles };
}
