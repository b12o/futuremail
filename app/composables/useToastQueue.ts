export type ToastVariant = "error" | "success" | "info" | "warning";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
}

const DEFAULT_TOAST_DURATION = 5000;

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToastQueue() {
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function show(message: string, options: ToastOptions = {}): number {
    const id = nextId++;
    const duration = options.duration ?? DEFAULT_TOAST_DURATION;
    toasts.value = [
      ...toasts.value,
      { id, message, variant: options.variant ?? "info", duration },
    ];
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }

  return {
    toasts,
    show,
    dismiss,
    error: (message: string, duration?: number) =>
      show(message, { variant: "error", duration }),
    success: (message: string, duration?: number) =>
      show(message, { variant: "success", duration }),
    info: (message: string, duration?: number) =>
      show(message, { variant: "info", duration }),
    warning: (message: string, duration?: number) =>
      show(message, { variant: "warning", duration }),
  };
}
