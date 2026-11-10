/**
 * Web Worker: parses and preprocesses uploads off the main thread so the page stays responsive.
 * Messages in:  { files, skipped }
 * Messages out: { type: 'progress', progress } | { type: 'done', result } | { type: 'error', message }
 */
import { SkippedFile, parseStreamingFiles } from './parseFiles';

// The project compiles with the DOM lib, so type the worker scope by hand.
const ctx = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<{ files: File[]; skipped?: SkippedFile[] }>) => void) | null;
};

ctx.onmessage = async event => {
  try {
    const result = await parseStreamingFiles(
      event.data.files,
      progress => ctx.postMessage({ type: 'progress', progress }),
      event.data.skipped
    );
    ctx.postMessage({ type: 'done', result });
  } catch (err) {
    ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : 'Something went wrong while reading your files.' });
  }
};
