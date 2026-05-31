export type MockLiveLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

export interface MockLiveLogEntry {
  timestamp: string;
  level: MockLiveLogLevel;
  source: string;
  message: string;
}

export interface MockLiveServiceStatus {
  generatedAt: string;
  streamLabel: string;
  logs: MockLiveLogEntry[];
}

function clock(offsetSeconds = 0): string {
  const date = new Date(Date.now() - offsetSeconds * 1000);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
}

/** Mock adapter. Replace this function with the future backend log stream. */
export function getMockLiveServiceStatus(): MockLiveServiceStatus {
  return {
    generatedAt: new Date().toISOString(),
    streamLabel: 'mock://backend/logs',
    logs: [
      { timestamp: clock(2), level: 'SUCCESS', source: 'resource-service', message: 'resource #1842 transitioned to ACTIVE' },
      { timestamp: clock(8), level: 'INFO', source: 'query-dispatcher', message: 'heartbeat accepted from query-node-04' },
      { timestamp: clock(15), level: 'WARN', source: 'payment-gateway', message: 'gateway latency crossed mock threshold: 318ms' },
      { timestamp: clock(24), level: 'INFO', source: 'audio-bot', message: 'playlist cache refreshed for resource #1731' },
      { timestamp: clock(38), level: 'SUCCESS', source: 'scheduler', message: 'auto-prolong batch completed: 12 resources checked' },
      { timestamp: clock(52), level: 'INFO', source: 'auth', message: 'session rotation completed successfully' },
      { timestamp: clock(66), level: 'ERROR', source: 'mock-monitor', message: 'sample error line for log viewer validation' },
    ],
  };
}
