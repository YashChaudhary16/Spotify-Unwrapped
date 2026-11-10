/**
 * Web Worker: parses and preprocesses uploads off the main thread so the page stays responsive.
 * Messages out: { type: 'progress', progress } | { type: 'done', records } | { type: 'error', message }
 */
import { parseStreamingFiles } from './parseFiles';

// The project compiles with the DOM lib, so type the worker scope by hand.
const ctx = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<{ files: File[] }>) => void) | null;
};

ctx.onmessage = async event => {
  try {
    const records = await parseStreamingFiles(event.data.files, progress =>
      ctx.postMessage({ type: 'progress', progress })
    );
    ctx.postMessage({ type: 'done', records });
  } catch (err) {
    ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : 'Something went wrong while reading your files.' });
  }
};
