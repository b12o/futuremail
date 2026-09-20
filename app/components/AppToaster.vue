<script setup lang="ts">
import type { ToastVariant } from "~/composables/useToastQueue";

const { toasts, dismiss } = useToastQueue();

const labels: Record<ToastVariant, string> = {
  error: "Error",
  success: "Done",
  info: "Heads up",
  warning: "Warning",
};

const variants: Record<ToastVariant, string> = {
  error: "red",
  success: "green",
  info: "cyan",
  warning: "orange",
};
</script>

<template>
  <div class="nb-toaster" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="nb-toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="nb-toast"
        :class="`nb-toast-${toast.variant}`"
        role="alert"
      >
        <div class="nb-toast-body">
          <span class="nb-badge" :class="`nb-badge-${variants[toast.variant]}`">
            {{ labels[toast.variant] }}
          </span>
          <p class="nb-toast-message">{{ toast.message }}</p>
        </div>

        <div class="nb-toast-track">
          <span
            class="nb-toast-progress"
            :style="{ '--nb-toast-duration': `${toast.duration}ms` }"
          />
        </div>

        <button
          type="button"
          class="nb-toast-close"
          aria-label="Dismiss"
          @click="dismiss(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
