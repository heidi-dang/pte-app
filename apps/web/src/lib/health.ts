export type ServiceStatus = 'loading' | 'ok' | 'fail';

export interface HealthConfig {
  apiUrl: string;
  scoringUrl: string;
  configMissing: boolean;
}

export function getHealthConfig(): HealthConfig {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const scoringUrl = process.env.NEXT_PUBLIC_SCORING_URL || '';
  return {
    apiUrl,
    scoringUrl,
    configMissing: !apiUrl || !scoringUrl,
  };
}

export async function checkService(url: string, timeoutMs = 5000): Promise<ServiceStatus> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok ? 'ok' : 'fail';
  } catch {
    return 'fail';
  }
}

export function getHealthUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/health/live`;
}
