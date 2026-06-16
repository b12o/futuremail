<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const navItems: NavigationMenuItem[] = [
  {
    label: "New capsule",
    icon: "i-lucide-mail-plus",
    active: true,
  },
  {
    label: "On the way",
    icon: "i-lucide-send-horizontal",
  },
];

const footerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: "Settings",
    icon: "i-lucide-settings",
    to: "/settings",
  },
  {
    label: "Log out",
    icon: "i-lucide-log-out",
  },
]);

const user = ref({
  name: "Barnabas Edubio",
  avatar: {
    src: "https://github.com/b12o.png",
    alt: "Barnabas Edubio",
  },
});
</script>

<template>
  <div class="flex flex-1">
    <USidebar>
      <template #header>
        <h2 class="text-2xl font-bold">FutureMail</h2>
      </template>
      <UNavigationMenu :items="navItems" orientation="vertical" />
      <template #footer>
        <UDropdownMenu :items="footerItems">
          <UButton
            v-bind="user"
            :label="user?.name"
            trailing-icon="i-lucide-chevrons-up-down"
            variant="ghost"
          />
        </UDropdownMenu>
      </template>
    </USidebar>
  </div>
</template>
