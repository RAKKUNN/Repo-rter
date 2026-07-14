import { isTauri, invoke } from '@tauri-apps/api/core';

export interface TrafficDataPoint {
  timestamp: string;
  count: number;
  uniques: number;
}

export async function mergeTrafficData(repoKey: string, type: 'views' | 'clones', incomingData: TrafficDataPoint[]): Promise<TrafficDataPoint[]> {
  if (typeof window === 'undefined') return incomingData;
  
  let storedData: TrafficDataPoint[] = [];
  const storageKey = `gittraffic_${type}_${repoKey}`;
  const runningInTauri = isTauri();

  if (runningInTauri) {
    try {
      const storedStr = await invoke<string>('load_traffic_data', { repoKey, dataType: type });
      storedData = storedStr ? JSON.parse(storedStr) : [];
    } catch (e) {
      console.error('Failed to load traffic data from file:', e);
      const storedStr = localStorage.getItem(storageKey);
      storedData = storedStr ? JSON.parse(storedStr) : [];
    }
  } else {
    const storedStr = localStorage.getItem(storageKey);
    storedData = storedStr ? JSON.parse(storedStr) : [];
  }
  
  // Create a map for O(1) merging
  const dataMap = new Map<string, TrafficDataPoint>();
  
  // Add stored data to map
  storedData.forEach(pt => {
    const dateKey = new Date(pt.timestamp).toISOString().split('T')[0];
    dataMap.set(dateKey, pt);
  });
  
  // Add incoming data to map
  incomingData.forEach(pt => {
    const dateKey = new Date(pt.timestamp).toISOString().split('T')[0];
    dataMap.set(dateKey, pt);
  });
  
  // Convert map back to array and sort chronologically
  const mergedData = Array.from(dataMap.values()).sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  
  // Save back
  if (runningInTauri) {
    try {
      await invoke('save_traffic_data', { repoKey, dataType: type, data: JSON.stringify(mergedData) });
    } catch (e) {
      console.error('Failed to save traffic data to file:', e);
      localStorage.setItem(storageKey, JSON.stringify(mergedData));
    }
  } else {
    localStorage.setItem(storageKey, JSON.stringify(mergedData));
  }
  
  return mergedData;
}
