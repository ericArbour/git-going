// https://docs.skypack.dev/skypack-cdn/code/javascript

// First, let TypeScript allow all module names starting with "https://". This will suppress TS errors.
declare module 'https://*';

// Second, list out all your dependencies. For every URL, you must map it to its local module.
declare module 'https://cdn.skypack.dev/@hotwired/turbo' {
  export * from '@hotwired/turbo';
}

declare module 'https://cdn.skypack.dev/stimulus' {
  export * from 'stimulus';
}
