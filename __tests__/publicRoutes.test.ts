import { PUBLIC_ROUTE_SEGMENTS, isPublicRouteSegment } from '@/utils/publicRoutes';

describe('publicRoutes', () => {
  it('includes the full onboarding flow in public route segments', () => {
    expect(PUBLIC_ROUTE_SEGMENTS).toContain('notification-permission');
    expect(PUBLIC_ROUTE_SEGMENTS).toContain('paywall');
  });

  it('recognizes public route segments correctly', () => {
    expect(isPublicRouteSegment('auth')).toBe(true);
    expect(isPublicRouteSegment('notification-permission')).toBe(true);
    expect(isPublicRouteSegment('paywall')).toBe(true);
    expect(isPublicRouteSegment('(tabs)')).toBe(false);
  });
});