<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

const navItems: NavigationMenuItem[] = [
  {
    label: "New capsule",
    icon: "i-lucide-mail-plus",
    to: "/new",
    active: true,
  },
  {
    label: "In transit",
    icon: "i-lucide-send-horizontal",
    to: "/transit",
  },
  {
    label: "Delivered",
    icon: "i-lucide-check",
    to: "/delivered",
  },
  {
    label: "Settings",
    icon: "i-lucide-settings",
    to: "/settings",
  },
];

const footerItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Log out",
      icon: "i-lucide-log-out",
    },
  ],
]);

const user = ref({
  name: "b12o",
  avatar: {
    src: "https://github.com/b12o.png",
    alt: "b12o's profile picture",
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
