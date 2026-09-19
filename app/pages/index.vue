<script setup lang="ts">
import type { SessionData } from "~/types/email";

const {
  data: session,
  status,
  refresh: refreshSession,
} = useFetch<SessionData>("/api/auth/get-session");

const user = computed(() => session.value?.user ?? null);
const signedIn = computed(() => !!user.value);

const transitBoard = useTemplateRef<{ refresh: () => void } | null>(
  "transitBoard",
);

async function onSignedOut() {
  await refreshSession();
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader :user-email="user?.email ?? null" @signed-out="onSignedOut" />

    <main class="max-w-6xl w-full mx-auto p-4 md:p-6 flex-1">
      <div
        v-if="status === 'pending'"
        class="flex flex-col gap-4 max-w-xl mx-auto"
      >
        <div class="nb-card h-64 animate-pulse" />
        <div class="nb-card h-32 animate-pulse" />
      </div>

      <div v-else-if="!signedIn" class="py-10">
        <div class="flex justify-center gap-4 flex-wrap mb-8">
          <span class="nb-sticker !bg-nb-yellow">Self-hosted</span>
          <span class="nb-sticker nb-sticker-r !bg-nb-pink">No tracking</span>
          <span class="nb-sticker !bg-nb-cyan">Time-proof</span>
        </div>
        <SignInCard @signed-in="refreshSession" />
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div class="lg:col-span-3">
          <ComposeCard
            :user-email="user!.email"
            @scheduled="transitBoard?.refresh()"
          />
        </div>
        <div class="lg:col-span-2">
          <TransitBoard ref="transitBoard" />
        </div>
      </div>
    </main>

    <footer
      class="border-t-[3px] border-ink py-3 px-4 text-center text-xs font-bold uppercase tracking-wider"
    >
      © {{ new Date().getFullYear() }} FutureMail.to · self hosted
    </footer>
  </div>
</template>
