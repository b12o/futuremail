<script setup lang="ts">
const props = defineProps<{ userEmail?: string | null }>();

const emit = defineEmits<{ "signed-out": [] }>();

const signingOut = ref(false);

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
        <span v-else class="nb-sticker nb-sticker-r !bg-nb-cyan"
          >Self-hosted</span
        >
      </div>
    </div>
  </header>
</template>
