import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock server-only React package for Vitest runs
vi.mock('server-only', () => ({}));
