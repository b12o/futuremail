<script setup lang="ts">
const emit = defineEmits<{ "signed-in": [] }>();

const toast = useToastQueue();

const email = ref("");
const code = ref("");
const step = ref<"email" | "code">("email");
const submitting = ref(false);
const resending = ref(false);

async function sendCode() {
  await $fetch("/api/auth/email-otp/send-verification-otp", {
    method: "POST",
    body: { email: email.value.trim(), type: "sign-in" },
  });
}

async function submitEmail() {
  if (!email.value.trim()) {
    toast.error("Please enter an email address");
    return;
  }
  submitting.value = true;
  try {
    await sendCode();
    step.value = "code";
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    submitting.value = false;
  }
}

async function submitCode() {
  if (!/^\d{6}$/.test(code.value.trim())) {
    toast.error("Enter the 6-digit code");
    return;
  }
  submitting.value = true;
  try {
    await $fetch("/api/auth/sign-in/email-otp", {
      method: "POST",
      body: { email: email.value.trim(), otp: code.value.trim() },
    });
    emit("signed-in");
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    submitting.value = false;
  }
}

async function resend() {
  resending.value = true;
  try {
    await sendCode();
    code.value = "";
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    resending.value = false;
  }
}

function reset() {
  step.value = "email";
  code.value = "";
}
</script>

<template>
  <div class="nb-card w-full max-w-md mx-auto">
    <template v-if="step === 'email'">
      <h2 class="font-display text-2xl uppercase mb-1">Welcome!</h2>
      <p class="text-sm mb-5 opacity-70">Please sign in to get started.</p>

      <form class="flex flex-col gap-4" @submit.prevent="submitEmail">
        <div>
          <label class="nb-label mb-1.5" for="signin-email">Email</label>
          <input
            id="signin-email"
            v-model="email"
            type="email"
            class="nb-input"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>

        <button
          type="submit"
          class="nb-btn nb-btn-yellow"
          :disabled="submitting"
        >
          <span v-if="submitting">One moment…</span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </template>

    <template v-else>
      <h2 class="font-display text-2xl uppercase mb-2">Check your inbox ✉</h2>
      <p class="text-sm mb-2">
        Enter the code we sent to
        <span class="font-bold" :title="email.trim()">{{
          truncateEmail(email.trim())
        }}</span>
      </p>
      <p class="text-sm mb-5 opacity-70">The code expires in 5 minutes.</p>

      <form class="flex flex-col gap-4" @submit.prevent="submitCode">
        <div>
          <label class="nb-label mb-1.5" for="signin-code">Code</label>
          <input
            id="signin-code"
            v-model="code"
            type="text"
            class="nb-input tracking-[0.5em] text-center font-display text-xl"
            placeholder="······"
            inputmode="numeric"
            pattern="\d{6}"
            maxlength="6"
            autocomplete="one-time-code"
            required
          />
        </div>

        <button
          type="submit"
          class="nb-btn nb-btn-yellow"
          :disabled="submitting"
        >
          <span v-if="submitting">Verifying…</span>
          <span v-else>Verify & sign in</span>
        </button>

        <div class="flex items-center justify-between text-sm">
          <button
            type="button"
            class="underline font-bold disabled:opacity-50 cursor-pointer"
            :disabled="resending"
            @click="resend"
          >
            {{ resending ? "Resending…" : "Resend code" }}
          </button>
          <button
            type="button"
            class="underline font-bold cursor-pointer"
            @click="reset"
          >
            Use a different email
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
