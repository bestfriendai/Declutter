export const PUBLIC_ROUTE_SEGMENTS = [
  'auth',
  'onboarding',
  'splash',
  'notification-permission',
  'paywall',
  'join',
  '+not-found',
] as const;

export function isPublicRouteSegment(segment: string | undefined): boolean {
  return PUBLIC_ROUTE_SEGMENTS.includes(
    (segment ?? '') as (typeof PUBLIC_ROUTE_SEGMENTS)[number]
  );
}
