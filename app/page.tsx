'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Dashboard from '@/components/Dashboard';
import { RawStreamingRecord } from '@/lib/preprocessing';
import { ProcessedRecord } from '@/lib/preprocessing';

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
      
      // Preprocess the data
      const response = await fetch('/api/preprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: allRecords }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to preprocess data');
      }
      
      const { processed } = await response.json();
      // Convert timestamp strings back to Date objects (JSON serialization converts Date to string)
      const normalizedData = processed.map((record: any) => ({
        ...record,
        timestamp: typeof record.timestamp === 'string' 
          ? new Date(record.timestamp) 
          : record.timestamp,
      }));
      setProcessedData(normalizedData);
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

  return (
    <main className="min-h-screen bg-spotify-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center">
            <span className="text-2xl">🎧</span>
          </div>
          <h1 className="text-4xl font-bold text-spotify-green">Spotify Analytics</h1>
        </div>
        
        <div className="text-3xl font-extrabold mb-8 text-spotify-green">
          🎧 Your Ultimate Spotify Wrapped Dashboard
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragActive
                ? 'border-spotify-green bg-spotify-gray/50'
                : 'border-spotify-gray hover:border-spotify-green/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <p className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop your files here' : 'Upload your Spotify JSON files'}
              </p>
              <p className="text-spotify-lightgray">
                Drag and drop your StreamingHistory JSON file(s), or click to select
              </p>
            </div>
            <p className="text-sm text-spotify-lightgray mt-4">
              Your data is processed entirely in-memory and never saved to disk
            </p>
          </div>
        </div>

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
            <p className="mt-2 text-spotify-lightgray">Processing your data...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-spotify-gray/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-spotify-green">How to get your data:</h2>
          <ol className="list-decimal list-inside space-y-2 text-spotify-lightgray">
            <li>Go to your Spotify account settings</li>
            <li>Request your extended streaming history</li>
            <li>Download the JSON files (usually named Streaming_History_Audio_*.json)</li>
            <li>Upload them here to see your analytics</li>
          </ol>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 p-4 bg-spotify-gray/30 rounded-lg border border-spotify-green/30">
          <p className="text-sm text-spotify-lightgray">
            <strong className="text-spotify-green">🔒 Privacy Notice:</strong> Your data is processed entirely in-memory and never saved to disk. 
            IP addresses are automatically removed for your privacy. When you close this page, your data is completely removed.
          </p>
        </div>
      </div>
    </main>
  );
}

