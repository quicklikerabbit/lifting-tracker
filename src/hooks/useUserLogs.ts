import { useEffect, useState } from 'react';
import { subscribeToUserLogs } from '../services/logsService';
import type { Log } from '../types';

export function useUserLogs(uid: string | undefined): Log[] {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    if (!uid) return;
    return subscribeToUserLogs(uid, setLogs);
  }, [uid]);

  return logs;
}
