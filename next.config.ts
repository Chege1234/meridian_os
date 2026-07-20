import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * React Compiler — automatically memoizes components and hooks
   * Reduces unnecessary re-renders during navigation without manual useMemo/useCallback.
   */
  reactCompiler: true,

  /**
   * Client-side router cache configuration.
   * Extends how long page segments stay cached after navigation,
   * making back/forward navigation feel instant.
   */
  experimental: {
    staleTimes: {
      dynamic: 30,  // seconds — cache dynamic pages on the client (default: 0)
      static: 300,  // seconds — cache statically-generated pages (default: 300)
    },
  },

  /**
   * Development logging — helps identify slow fetch calls and Server Function
   * bottlenecks during development.
   */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  /**
   * Dev indicators position.
   */
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
