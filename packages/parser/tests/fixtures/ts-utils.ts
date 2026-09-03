export const MAX_RETRY = 3;

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseData(data: any) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}
