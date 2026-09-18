<script setup lang="ts">
const email = ref("");
const submitting = ref(false);
const sent = ref(false);
const error = ref("");

async function submit() {
  if (!email.value.trim()) {
    error.value = "Enter an email address";
    return;
  }
  submitting.value = true;
  error.value = "";
  try {
    await $fetch("/api/auth/sign-in/magic-link", {
      method: "POST",
      body: { email: email.value.trim(), callbackURL: "/" },
    });
    sent.value = true;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}

function reset() {
  sent.value = false;
  error.value = "";
}
</script>

<template>
  <div class="nb-card w-full max-w-md mx-auto">
    <template v-if="!sent">
      <h2 class="font-display text-2xl uppercase mb-1">Sign in</h2>
      <p class="text-sm mb-5 opacity-70">We mail you a one-time link. No passwords, ever.</p>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div>
          <label class="nb-label mb-1.5" for="signin-email">Email</label>
          <input
            id="signin-email"
            v-model="email"
            type="email"
            class="nb-input"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <p v-if="error" class="nb-badge nb-badge-red self-start">{{ error }}</p>

        <button type="submit" class="nb-btn nb-btn-yellow" :disabled="submitting">
          <span v-if="submitting">Sending…</span>
          <span v-else>Send magic link ✉</span>
        </button>
      </form>
    </template>

    <template v-else>
      <h2 class="font-display text-2xl uppercase mb-2">Check your inbox ✉</h2>
      <p class="text-sm mb-2">
        A magic link is on its way to
        <span class="font-bold">{{ email.trim() }}</span>
      </p>
      <p class="text-sm mb-5 opacity-70">The link expires in 5 minutes.</p>
      <button type="button" class="underline font-bold text-sm" @click="reset">
        Use a different email
      </button>
    </template>
  </div>
</template>
