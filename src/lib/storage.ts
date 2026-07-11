export interface TrafficDataPoint {
  timestamp: string;
  count: number;
  uniques: number;
}

export function mergeTrafficData(repoKey: string, type: 'views' | 'clones', incomingData: TrafficDataPoint[]): TrafficDataPoint[] {
  if (typeof window === 'undefined') return incomingData;
  
  const storageKey = `gittraffic_${type}_${repoKey}`;
  const storedStr = localStorage.getItem(storageKey);
  let storedData: TrafficDataPoint[] = storedStr ? JSON.parse(storedStr) : [];
  
  // Create a map for O(1) merging
  const dataMap = new Map<string, TrafficDataPoint>();
  
  // Add stored data to map
  storedData.forEach(pt => {
    // Normalize timestamp to date string YYYY-MM-DD to avoid timezone issues
    const dateKey = new Date(pt.timestamp).toISOString().split('T')[0];
    dataMap.set(dateKey, pt);
  });
  
  // Add incoming data to map (overwrites old data for the same day with potentially fresher data)
  incomingData.forEach(pt => {
    const dateKey = new Date(pt.timestamp).toISOString().split('T')[0];
    dataMap.set(dateKey, pt);
  });
  
  // Convert map back to array and sort chronologically
  const mergedData = Array.from(dataMap.values()).sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  
  // Save back to local storage
  localStorage.setItem(storageKey, JSON.stringify(mergedData));
  
  return mergedData;
}
