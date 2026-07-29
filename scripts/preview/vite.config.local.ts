// Untracked override for the machine-setup preview session.
// Do NOT commit this file (it is not tracked by git). It wraps the repo's own
// vite.config.ts and only adds server.allowedHosts + host binding so the
// public preview proxy hostname is accepted. Start the dev server with:
//   npx vite --config scripts/preview/vite.config.local.ts
import baseConfig from '../../vite.config';

export default async (env: any) => {
  const resolvedBase =
    typeof baseConfig === 'function' ? await baseConfig(env) : baseConfig;
  return {
    ...resolvedBase,
    server: {
      ...(resolvedBase.server || {}),
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
};
