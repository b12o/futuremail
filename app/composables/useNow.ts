const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

export function useNow() {
  if (import.meta.client && timer === undefined) {
    timer = setInterval(() => {
      now.value = Date.now();
    }, 1000);
  }
  return now;
}
