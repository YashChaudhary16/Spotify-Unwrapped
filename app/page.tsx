'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { AlertCircle, ExternalLink, PlayCircle, ShieldCheck, Upload } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import { Brand } from '@/components/ui/Brand';
import { Card, CardTitle } from '@/components/ui/Card';
import { ProcessedRecord, preprocessStreamingHistory } from '@/lib/preprocessing';
import { ImportResult, ParseProgress, SkippedFile, parseStreamingFiles } from '@/lib/parseFiles';
import { formatNumber } from '@/lib/format';

const SPOTIFY_PRIVACY_URL = 'https://www.spotify.com/account/privacy/';

type WorkerMessage =
  | { type: 'progress'; progress: ParseProgress }
  | { type: 'done'; result: ImportResult }
  | { type: 'error'; message: string };

export default function Home() {
  const [processedData, setProcessedData] = useState<ProcessedRecord[] | null>(null);
  const [importSummary, setImportSummary] = useState<Omit<ImportResult, 'records'> | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const finish = (records: ProcessedRecord[], sample: boolean, summary: Omit<ImportResult, 'records'> | null = null) => {
    setProcessedData(records);
    setImportSummary(summary);
    setIsSample(sample);
    setLoading(false);
    setProgress(null);
  };

  const fail = (message: string) => {
    setError(message);
    setProcessedData(null);
    setLoading(false);
    setProgress(null);
  };

  const onDrop = useCallback(async (acceptedFiles: File[], rejections: FileRejection[]) => {
    // Non-.json files are skipped (and listed later) as long as some .json files remain.
    const skipped: SkippedFile[] = rejections.map(r => ({ name: r.file.name, reason: "isn't a .json file" }));
    if (acceptedFiles.length === 0) {
      if (rejections.length > 0) {
        fail(
          `${rejections.length === 1 ? `"${rejections[0].file.name}" isn't a .json file` : "None of these files are .json files"}. Unzip your Spotify export and choose the Streaming_History_Audio_*.json files inside.`
        );
      }
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ stage: 'reading', filesDone: 0, totalFiles: acceptedFiles.length });

    // Parse in a Web Worker so the page stays responsive; fall back to the main thread if workers aren't available.
    if (typeof Worker !== 'undefined') {
      workerRef.current?.terminate();
      const worker = new Worker(new URL('../lib/parser.worker.ts', import.meta.url));
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const msg = event.data;
        if (msg.type === 'progress') setProgress(msg.progress);
        else {
          worker.terminate();
          workerRef.current = null;
          if (msg.type === 'done') {
            const { records, ...summary } = msg.result;
            finish(records, false, summary);
          } else fail(msg.message);
        }
      };
      worker.onerror = () => {
        worker.terminate();
        workerRef.current = null;
        fail('Something went wrong while reading your files. Please try again.');
      };
      worker.postMessage({ files: acceptedFiles, skipped });
      return;
    }

    try {
      const { records, ...summary } = await parseStreamingFiles(acceptedFiles, setProgress, skipped);
      finish(records, false, summary);
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Something went wrong while reading your files.');
    }
  }, []);

  const loadSample = async () => {
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      // A real year of listening (see lib/demoHistory.ts), fetched only now. The file has a day of margin on
      // each side for timezones, so keep only plays that fall in the demo year in local time.
      const { loadDemoHistory } = await import('@/lib/demoHistory');
      const { year, records } = await loadDemoHistory();
      finish(preprocessStreamingHistory(records).filter(r => r.Year === year), true);
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not load the sample data.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: true,
    disabled: loading,
  });

  const resetData = () => {
    setProcessedData(null);
    setImportSummary(null);
    setIsSample(false);
    setError(null);
  };

  if (processedData) {
    return (
      <Dashboard data={processedData} onReset={resetData} isSample={isSample} importSummary={importSummary} />
    );
  }

  const readingPct =
    progress && progress.totalFiles > 0 ? Math.round((progress.filesDone / progress.totalFiles) * 100) : 0;

  return (
    <main className="min-h-screen bg-spotify-black p-6 text-white md:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Brand size="lg" />
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-4xl">
            Your full Spotify listening history, visualized.
          </h1>
          <p className="mt-3 text-lg text-spotify-lightgray">
            Top tracks, albums, artists, habits and streaks across every year — processed privately in your browser.
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors duration-200 md:p-12 ${
            loading ? 'cursor-wait opacity-60' : 'cursor-pointer'
          } ${
            isDragActive
              ? 'border-spotify-green bg-spotify-highlight'
              : 'border-spotify-border bg-spotify-dark hover:border-spotify-muted hover:bg-spotify-highlight'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-spotify-gray">
              <Upload className="h-6 w-6 text-spotify-green" aria-hidden />
            </div>
            <div>
              <p className="mb-1 text-xl font-semibold">
                {isDragActive ? 'Drop your files here' : 'Upload your streaming history'}
              </p>
              <p className="text-spotify-lightgray">
                Drag and drop your Streaming_History_Audio_*.json files, or click to choose them. You can select them all at once.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <span className="text-sm text-spotify-lightgray">No export yet?</span>
          <button
            type="button"
            onClick={loadSample}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
          >
            <PlayCircle className="h-4 w-4" aria-hidden />
            Try with sample data
          </button>
        </div>

        {loading && (
          <div className="mt-8 rounded-xl border border-spotify-border bg-spotify-dark p-5" role="status" aria-live="polite">
            {progress?.stage === 'reading' ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="truncate text-white">
                    Reading file {Math.min(progress.filesDone + 1, progress.totalFiles)} of {progress.totalFiles}
                    {progress.fileName && <span className="text-spotify-lightgray"> · {progress.fileName}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-spotify-lightgray">{readingPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-spotify-gray">
                  <div className="h-full rounded-full bg-spotify-green transition-all" style={{ width: `${readingPct}%` }} />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm text-white">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-spotify-gray border-t-spotify-green" />
                {progress?.records
                  ? `Crunching ${formatNumber(progress.records)} plays…`
                  : 'Preparing your dashboard…'}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/40 p-4" role="alert">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
            <div>
              <p className="font-semibold text-red-200">We couldn&apos;t read that upload</p>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-10">
          <CardTitle subtitle="It's free, but Spotify can take up to 30 days to prepare it (often much sooner).">
            How to get your data
          </CardTitle>
          <ol className="space-y-3 text-spotify-lightgray">
            {[
              <>
                Open your{' '}
                <a
                  href={SPOTIFY_PRIVACY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-white underline decoration-spotify-muted underline-offset-4 hover:decoration-white"
                >
                  Spotify account privacy page
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>{' '}
                and scroll to <span className="text-white">Download your data</span>.
              </>,
              <>
                Tick <span className="text-white">Extended streaming history</span> (not just &quot;Account data&quot;) and
                request it. Confirm the email Spotify sends you.
              </>,
              <>When Spotify emails you the download link, download and unzip the file.</>,
              <>
                Upload every <span className="text-white">Streaming_History_Audio_*.json</span> file here, all at once.
              </>,
            ].map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spotify-gray text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* Privacy Notice */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-spotify-border bg-spotify-dark p-4 text-sm text-spotify-lightgray">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-spotify-green" aria-hidden />
          <p>
            <strong className="font-semibold text-white">Private by design.</strong> Your data is processed entirely
            in your browser and never uploaded or saved. IP addresses are removed automatically, and closing this page
            clears everything.
          </p>
        </div>
      </div>
    </main>
  );
}
