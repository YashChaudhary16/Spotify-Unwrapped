'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, ShieldCheck, Upload } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import { Brand } from '@/components/ui/Brand';
import { Card, CardTitle } from '@/components/ui/Card';
import { RawStreamingRecord, ProcessedRecord, preprocessStreamingHistory } from '@/lib/preprocessing';

export default function Home() {
  const [processedData, setProcessedData] = useState<ProcessedRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true);
    setError(null);

    try {
      const allRecords: RawStreamingRecord[] = [];

      // Read all JSON files
      for (const file of acceptedFiles) {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        if (Array.isArray(jsonData)) {
          allRecords.push(...jsonData);
        } else {
          throw new Error('Invalid JSON format: expected an array');
        }
      }

      if (allRecords.length === 0) {
        throw new Error('No records found in uploaded files');
      }

      // Preprocess on client to avoid large uploads
      const processed = preprocessStreamingHistory(allRecords);
      setProcessedData(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProcessedData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    multiple: true,
  });

  const resetData = () => {
    setProcessedData(null);
    setError(null);
  };

  if (processedData) {
    return <Dashboard data={processedData} onReset={resetData} />;
  }

  // TODO(Step 4): sample-data button, clearer instructions with link, Web Worker parsing + progress.
  return (
    <main className="min-h-screen bg-spotify-black p-6 text-white md:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Brand size="lg" />
          <p className="mt-4 text-lg text-spotify-lightgray">
            Your full Spotify listening history, visualized — privately, right in your browser.
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors duration-200 ${
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
                Drag and drop your Streaming_History_Audio_*.json files, or click to choose them
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-spotify-gray border-t-spotify-green"></div>
            <p className="mt-2 text-spotify-lightgray">Processing your data…</p>
          </div>
        )}

        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/40 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-10">
          <CardTitle>How to get your data</CardTitle>
          <ol className="list-inside list-decimal space-y-2 text-spotify-lightgray">
            <li>Go to your Spotify account settings</li>
            <li>Request your extended streaming history</li>
            <li>Download the JSON files (usually named Streaming_History_Audio_*.json)</li>
            <li>Upload them here to see your analytics</li>
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
