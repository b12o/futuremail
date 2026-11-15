<script setup lang="ts">
const value = defineModel<number>({ required: true });

const props = withDefaults(
  defineProps<{
    options: { value: number; label: string; disabled?: boolean }[];
    label: string;
    direction?: "up" | "down";
    panelClass?: string;
    triggerClass?: string;
  }>(),
  { direction: "down", panelClass: "", triggerClass: "" },
);

const open = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const triggerEl = ref<HTMLButtonElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);

const selectedLabel = computed(
  () =>
    props.options.find((option) => option.value === value.value)?.label ?? "",
);

function toggle() {
  open.value = !open.value;
}

function close(refocus: boolean) {
  if (!open.value) return;
  open.value = false;
  if (refocus) nextTick(() => triggerEl.value?.focus());
}

function pick(option: { value: number; disabled?: boolean }) {
  if (option.disabled) return;
  value.value = option.value;
  close(true);
}

function enabledOptions(): HTMLElement[] {
  return Array.from(
    panelEl.value?.querySelectorAll<HTMLElement>(
      '[role="option"]:not([disabled])',
    ) ?? [],
  );
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    close(true);
    return;
  }
  if (!open.value) return;

  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();

  const items = enabledOptions();
  if (items.length === 0) return;

  const index = items.indexOf(document.activeElement as HTMLElement);
  let next: number;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = items.length - 1;
  else if (event.key === "ArrowDown") next = (index + 1) % items.length;
  else next = index <= 0 ? items.length - 1 : index - 1;

  items[next]?.focus();
}

function onDocumentMousedown(event: MouseEvent) {
  if (!open.value) return;
  if (rootEl.value?.contains(event.target as Node)) return;
  open.value = false;
}

function onFocusOut(event: FocusEvent) {
  if (!open.value) return;
  const next = event.relatedTarget as Node | null;
  if (next && rootEl.value?.contains(next)) return;
  open.value = false;
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  nextTick(() => {
    const selected = panelEl.value?.querySelector<HTMLElement>(
      '[aria-selected="true"]:not([disabled])',
    );
    selected?.focus();
    selected?.scrollIntoView({ block: "nearest" });
  });
});

onMounted(() => {
  if (!import.meta.client) return;
  window.addEventListener("mousedown", onDocumentMousedown);
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  window.removeEventListener("mousedown", onDocumentMousedown);
});
</script>

<template>
  <div ref="rootEl" class="relative" @keydown="onKeydown" @focusout="onFocusOut">
    <button
      ref="triggerEl"
      type="button"
      class="nb-input appearance-none !py-1 !pl-2 !pr-6 text-left cursor-pointer"
      :class="triggerClass"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="`${label}: ${selectedLabel}`"
      @click="toggle"
    >
      {{ selectedLabel }}
    </button>
    <span class="nb-select-arrow">▾</span>

    <div
      v-if="open"
      ref="panelEl"
      role="listbox"
      :aria-label="label"
      tabindex="-1"
      class="absolute left-0 z-20 w-full overflow-y-auto bg-surface border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] py-1"
      :class="[
        direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1',
        panelClass,
      ]"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="option"
        :aria-selected="option.value === value"
        :disabled="option.disabled"
        class="nb-listbox-option"
        :class="{ 'nb-listbox-option-selected': option.value === value }"
        @click="pick(option)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
