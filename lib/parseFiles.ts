import { ProcessedRecord, RawStreamingRecord, preprocessStreamingHistory } from './preprocessing';

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

/** Checks that a parsed file is extended streaming history, with a helpful message if not. */
function validateFile(json: unknown, fileName: string): asserts json is RawStreamingRecord[] {
  if (!Array.isArray(json)) {
    throw new Error(
      `"${fileName}" doesn't look like Spotify streaming history. Look for files named Streaming_History_Audio_*.json.`
    );
  }
  const sample = json.find(item => item && typeof item === 'object');
  if (!sample) return; // empty file — fine, it just adds nothing

  if ('endTime' in sample && 'msPlayed' in sample) {
    throw new Error(
      `"${fileName}" is from Spotify's basic "Account data" export. Unwrapped needs the "Extended streaming history" export (files named Streaming_History_Audio_*.json).`
    );
  }
  if (!('ts' in sample) || !('ms_played' in sample)) {
    throw new Error(
      `"${fileName}" doesn't look like Spotify streaming history. Look for files named Streaming_History_Audio_*.json.`
    );
  }
}

/** Reads, validates and preprocesses uploaded files. Runs in the worker (or on the main thread as a fallback). */
export async function parseStreamingFiles(
  files: File[],
  onProgress: (progress: ParseProgress) => void
): Promise<ProcessedRecord[]> {
  const all: RawStreamingRecord[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress({ stage: 'reading', filesDone: i, totalFiles: files.length, fileName: file.name });

    const text = await file.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`"${file.name}" isn't valid JSON. Upload the .json files from your Spotify data export, unchanged.`);
    }
    validateFile(json, file.name);
    for (const record of json) {
      if (record && typeof record.ts === 'string') all.push(record);
    }
  }

  if (all.length === 0) {
    throw new Error('No plays found in these files. Check that you selected your Streaming_History_Audio_*.json files.');
  }

  onProgress({ stage: 'processing', filesDone: files.length, totalFiles: files.length, records: all.length });
  return preprocessStreamingHistory(all);
}
