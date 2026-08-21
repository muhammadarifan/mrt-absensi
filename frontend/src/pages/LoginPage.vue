<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  <Card class="max-w-80 mx-auto mt-16">
    <CardHeader>
      <CardTitle class="text-xl">Login</CardTitle>
    </CardHeader>
    <CardContent>
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
        <Button type="submit" :disabled="loading" class="bg-[var(--brand)] text-white hover:opacity-90">
          {{ loading ? "Loading..." : "Login" }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
