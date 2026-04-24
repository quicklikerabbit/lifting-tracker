import { useEffect, useState } from 'react';
import { subscribeToGlobalStats } from '../services/logsService';

export function useGlobalStats(): number {
  const [totalWeightLifted, setTotalWeightLifted] = useState(0);

  useEffect(() => subscribeToGlobalStats(setTotalWeightLifted), []);

  return totalWeightLifted;
}
