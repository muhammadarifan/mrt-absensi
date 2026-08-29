<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const loggedIn = computed(() => route.path !== "/login" && route.path !== "/portal");

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
}
</script>

<template>
  <nav v-if="loggedIn">
    <span class="brand-mark"><span class="dot" />MRT Absensi</span>
    <router-link to="/">Absensi</router-link>
    <router-link to="/students">Siswa</router-link>
    <router-link to="/classes">Kelas</router-link>
    <router-link to="/devices">Perangkat</router-link>
    <Button size="sm" variant="ghost" class="text-[13px] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]" @click="logout">
      Logout
    </Button>
  </nav>
  <router-view v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>