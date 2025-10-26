import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize native modules for server-side code to prevent bundling issues
  // This is critical for @envio-dev/hypersync-client which uses native bindings
  serverExternalPackages: [
    '@envio-dev/hypersync-client',
    '@envio-dev/hypersync-client-darwin-arm64',
    '@envio-dev/hypersync-client-darwin-universal',
    '@envio-dev/hypersync-client-linux-x64-gnu',
    '@envio-dev/hypersync-client-linux-arm64-gnu',
  ],
};

export default nextConfig;
