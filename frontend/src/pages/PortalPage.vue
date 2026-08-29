<script setup lang="ts">
import { ref, watch } from "vue";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { api } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const { data: classes } = useQuery({ queryKey: ["portal-classes"], queryFn: api.getPortalClasses });

const classId = ref("");
const studentId = ref("");
const code = ref("");
const result = ref<{ ok: boolean; message: string } | null>(null);

const { data: portalStudents } = useQuery({
  queryKey: ["portal-students", classId],
  queryFn: () => api.getPortalStudents(Number(classId.value)),
  enabled: () => !!classId.value,
});

watch(classId, () => {
  studentId.value = "";
});

const checkinMutation = useMutation({
  mutationFn: () => api.checkin(Number(studentId.value), code.value),
  onSuccess: (res) => {
    if (res.status === "ok") {
      result.value = {
        ok: true,
        message: `${res.student_name}: ${res.attendance_status === "telat" ? "Telat" : "Hadir"}`,
      };
      code.value = "";
    } else if (res.status === "invalid_code") {
      result.value = { ok: false, message: "Kode salah, cek papan tulis." };
    } else {
      result.value = { ok: false, message: "Gagal absen, coba lagi." };
    }
  },
  onError: () => {
    result.value = { ok: false, message: "Gagal absen, coba lagi." };
  },
});

function onSubmit() {
  result.value = null;
  if (!studentId.value || !code.value) return;
  checkinMutation.mutate();
}
</script>

<template>
  <main class="page max-w-md">
    <h1>Absen Siswa</h1>
    <form class="flex flex-col gap-3.5" @submit.prevent="onSubmit">
      <div class="flex flex-col gap-1">
        <Label for="classId">Kelas</Label>
        <Select v-model="classId">
          <SelectTrigger id="classId" class="w-full">
            <SelectValue placeholder="Pilih kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="c in classes" :key="c.id" :value="String(c.id)">{{ c.name }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1">
        <Label for="studentId">Nama</Label>
        <Select v-model="studentId" :disabled="!classId">
          <SelectTrigger id="studentId" class="w-full">
            <SelectValue placeholder="Pilih nama" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="s in portalStudents" :key="s.id" :value="String(s.id)">{{ s.name }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1">
        <Label for="code">Kode Absensi</Label>
        <Input id="code" v-model="code" placeholder="Kode dari papan tulis" autocomplete="off" required />
      </div>
      <Button
        type="submit"
        :disabled="checkinMutation.isPending.value"
        class="bg-[var(--brand)] text-white hover:opacity-90"
      >
        {{ checkinMutation.isPending.value ? "Mengirim..." : "Absen" }}
      </Button>
      <p v-if="result" :class="result.ok ? 'text-[var(--brand)]' : 'text-[var(--danger)]'" class="!mb-0">
        {{ result.message }}
      </p>
    </form>
  </main>
</template>
