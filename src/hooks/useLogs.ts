import { useEffect, useState } from 'react';
import { subscribeToAllLogs } from '../services/logsService';
import type { Log } from '../types';

export function useLogs(): Log[] {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => subscribeToAllLogs(setLogs), []);

  return logs;
}
