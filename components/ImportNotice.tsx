'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { ImportResult } from '@/lib/parseFiles';
import { formatNumber } from '@/lib/format';

interface ImportNoticeProps {
  summary: Omit<ImportResult, 'records'>;
}

/** Tells the user, once, what the import left out — skipped files, podcasts/audiobooks, duplicates. */
export function ImportNotice({ summary }: ImportNoticeProps) {
  const [dismissed, setDismissed] = useState(false);
  const { report, skippedFiles } = summary;

  const notes: React.ReactNode[] = [];
  if (report.podcastPlays > 0) {
    notes.push(
      <>
        <span className="text-white">{formatNumber(report.podcastPlays)} podcast and audiobook plays</span> aren&apos;t
        included — this dashboard covers music only for now.
      </>
    );
  }
  if (report.duplicates > 0) {
    notes.push(
      <>
        <span className="text-white">{formatNumber(report.duplicates)} duplicate plays</span> were removed (for
        example, the same file uploaded twice).
      </>
    );
  }
  if (report.invalidRecords > 0) {
    notes.push(
      <>
        <span className="text-white">{formatNumber(report.invalidRecords)} rows</span> had no valid timestamp and were
        skipped.
      </>
    );
  }
  if (skippedFiles.length > 0) {
    notes.push(
      <>
        <span className="text-white">
          {formatNumber(skippedFiles.length)} file{skippedFiles.length === 1 ? ' was' : 's were'} skipped
        </span>{' '}
        because {skippedFiles.length === 1 ? "it isn't" : "they aren't"} streaming history:
        <ul className="mt-1 space-y-0.5 text-xs">
          {skippedFiles.slice(0, 8).map(file => (
            <li key={file.name} className="truncate">
              <span className="text-white">{file.name}</span> — {file.reason}
            </li>
          ))}
          {skippedFiles.length > 8 && <li>…and {skippedFiles.length - 8} more</li>}
        </ul>
      </>
    );
  }

  if (dismissed || notes.length === 0) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-spotify-border bg-spotify-dark p-4 text-sm text-spotify-lightgray" role="status">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-spotify-lightgray" aria-hidden />
      <ul className="min-w-0 flex-1 space-y-2">
        {notes.map((note, idx) => (
          <li key={idx}>{note}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-spotify-lightgray hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
