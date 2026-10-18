import "server-only";

// Read-only unless DASHBOARD_READONLY is explicitly "0" or "false". Read per request, not at build.
export const isReadOnly = () => !["0", "false"].includes((process.env.DASHBOARD_READONLY ?? "").trim().toLowerCase());
