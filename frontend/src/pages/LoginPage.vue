<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../lib/api";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();

async function onSubmit() {
  error.value = "";
  loading.value = true;
  try {
    const { token, user } = await api.login(email.value, password.value);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    router.push("/");
  } catch {
    error.value = "Email atau password salah";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center" style="background: var(--bg)">
    <div class="w-full max-w-[340px] px-4">
      <div class="flex flex-col items-center gap-1.5 mb-6">
        <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background: var(--brand-bg)">
          <span class="w-2.5 h-2.5 rounded-full" style="background: var(--brand)"></span>
        </div>
        <h1 class="text-[17px]">MRT Absensi</h1>
        <p class="text-[13px] m-0" style="color: var(--muted-2)">Masuk ke dashboard admin</p>
      </div>

      <div class="card p-6">
        <form class="flex flex-col gap-3.5" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" required autofocus />
          </div>
          <div class="flex flex-col gap-1">
            <Label for="password">Password</Label>
            <Input id="password" v-model="password" type="password" required />
          </div>
          <p v-if="error" class="text-[var(--danger)] text-[13px] -mt-1.5 mb-0">{{ error }}</p>
          <Button type="submit" :disabled="loading" class="bg-[var(--brand)] text-white hover:opacity-90 mt-1">
            {{ loading ? "Memproses..." : "Login" }}
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>