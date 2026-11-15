<script setup lang="ts">
const props = defineProps<{ userEmail?: string | null }>();

const emit = defineEmits<{ "signed-out": [] }>();

const signingOut = ref(false);

const colorMode = useColorMode();

function toggleColorMode() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}

const displayEmail = computed(() => truncateEmail(props.userEmail ?? ""));

async function signOut() {
  signingOut.value = true;
  try {
    await $fetch("/api/auth/sign-out", {
      method: "POST",
      body: {},
    });
  } finally {
    signingOut.value = false;
    emit("signed-out");
  }
}
</script>

<template>
  <header class="border-b-[3px] border-ink bg-paper">
    <div class="max-w-6xl mx-auto flex items-center gap-4 px-4 py-4 flex-wrap">
      <div
        class="nb-card !shadow-[4px_4px_0_var(--color-ink)] !p-2 !px-4 -rotate-1"
      >
        <span class="font-display text-2xl uppercase tracking-tight"
          >FutureMail</span
        >
      </div>

      <div class="ml-auto flex items-center gap-3 flex-wrap">
        <button
          type="button"
          class="nb-btn nb-btn-ghost !py-1.5 !px-3"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          @click="toggleColorMode"
        >
          <UIcon name="i-lucide-moon" class="size-4 dark:hidden" />
          <UIcon name="i-lucide-sun" class="size-4 hidden dark:inline-flex" />
        </button>

        <template v-if="props.userEmail">
          <span
            class="nb-badge nb-badge-lime max-w-full"
            :title="props.userEmail ?? undefined"
            >{{ displayEmail }}</span
          >
          <button
            type="button"
            class="nb-btn nb-btn-ghost !py-1.5 !px-3 !text-xs"
            :disabled="signingOut"
            @click="signOut"
          >
            Sign out
          </button>
        </template>
        <span v-else class="nb-sticker nb-sticker-r !bg-nb-cyan !text-on-accent"
          >Self-hosted</span
        >
      </div>
    </div>
  </header>
</template>
