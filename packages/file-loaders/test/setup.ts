// Polyfill DOMMatrix for pdfjs-dist in Node.js environment
let DOMMatrixPolyfill: any;
try {
  // Try to import @napi-rs/canvas, but handle gracefully if not available
  DOMMatrixPolyfill = require('@napi-rs/canvas').DOMMatrix;
} catch {
  // Fallback DOMMatrix implementation for environments where @napi-rs/canvas is not available
  DOMMatrixPolyfill = class {
    constructor() {
      // Minimal DOMMatrix implementation
    }
  };
}

if (typeof global.DOMMatrix === 'undefined') {
  // @ts-ignore
  global.DOMMatrix = DOMMatrixPolyfill;
}

// Polyfill URL.createObjectURL and URL.revokeObjectURL for pdfjs-dist
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = () => 'blob:http://localhost/fake-blob-url';
}
if (typeof global.URL.revokeObjectURL === 'undefined') {
  global.URL.revokeObjectURL = () => {
    /* no-op */
  };
}
