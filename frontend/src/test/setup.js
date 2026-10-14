import { expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Polyfill used by isomorphic-fetch / whatwg-fetch shim if the app uses it.
globalThis.fetch = vi.fn(() => Promise.resolve({
  ok: true,
  status: 200,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve('')
}));

beforeEach(() => {
  vi.clearAllMocks();
});
