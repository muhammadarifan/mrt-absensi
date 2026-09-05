<script setup lang="ts">
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { api } from "../lib/api";

const queryClient = useQueryClient();
const today = new Date().toISOString().slice(0, 10);
const nowTime = new Date().toTimeString().slice(0, 5);

const { data: students } = useQuery({ queryKey: ["students"], queryFn: api.getStudents });
const { data: classes } = useQuery({ queryKey: ["classes"], queryFn: api.getClasses });
const { data: attendanceToday } = useQuery({
  queryKey: ["attendance", today],
  queryFn: () => api.getAttendance(today),
});

const classNameById = computed(() => {
  const map = new Map<number, string>();
  for (const c of classes.value ?? []) map.set(c.id, c.name);
  return map;
});

const search = ref("");
const filteredStudents = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = students.value ?? [];
  if (!q) return list.slice(0, 30);
  return list.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 30);
});

const form = ref({ studentId: "", type: "hadir" as "hadir" | "pulang", date: today, time: nowTime });
const formError = ref("");
const formSuccess = ref("");

const saveMutation = useMutation({
  mutationFn: () =>
    api.createManualAttendance({
      studentId: Number(form.value.studentId),
      type: form.value.type,
      date: form.value.date,
      time: form.value.time,
    }),
  onSuccess: (_, _vars) => {
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
    const nama = students.value?.find((s) => s.id === Number(form.value.studentId))?.name ?? "Siswa";
    formSuccess.value = `${nama} berhasil dicatat ${form.value.type === "hadir" ? "Hadir" : "Pulang"}.`;
    formError.value = "";
    form.value.studentId = "";
    search.value = "";
  },
  onError: () => {
    formError.value = "Gagal menyimpan absen manual.";
    formSuccess.value = "";
  },
});

function onSubmit() {
  formError.value = "";
  formSuccess.value = "";
  if (!form.value.studentId) {
    formError.value = "Pilih siswa dulu";
    return;
  }
  saveMutation.mutate();
}

const manualEntriesToday = computed(() => {
  const rows = attendanceToday.value ?? [];
  const result: { id: number; nama: string; type: string; jam: string }[] = [];
  for (const r of rows) {
    if (r.hadir && r.hadir.deviceId === null) result.push({ id: r.hadir.id, nama: r.student.name, type: "Hadir", jam: r.hadir.scannedAt.slice(11, 16) });
    if (r.pulang && r.pulang.deviceId === null) result.push({ id: r.pulang.id, nama: r.student.name, type: "Pulang", jam: r.pulang.scannedAt.slice(11, 16) });
  }
  return result;
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => api.deleteAttendance(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
});
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div>
        <h1>Absen Manual</h1>
        <p>Buat siswa yang telat/kelewat jam absen otomatis</p>
      </div>
    </div>

    <div class="card p-5 mb-6 max-w-[440px]">
      <form class="flex flex-col gap-3.5" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-1">
          <Label>Cari Siswa</Label>
          <Input v-model="search" placeholder="Ketik nama..." />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Pilih Siswa</Label>
          <Select v-model="form.studentId">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Pilih dari hasil pencarian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in filteredStudents" :key="s.id" :value="String(s.id)">
                {{ s.name }} — {{ classNameById.get(s.classId) ?? "?" }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col gap-1">
          <Label>Tipe Absen</Label>
          <Select v-model="form.type">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hadir">Hadir</SelectItem>
              <SelectItem value="pulang">Pulang</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex gap-3">
          <div class="flex flex-col gap-1 flex-1">
            <Label>Tanggal</Label>
            <Input v-model="form.date" type="date" />
          </div>
          <div class="flex flex-col gap-1 flex-1">
            <Label>Jam</Label>
            <Input v-model="form.time" type="time" />
          </div>
        </div>
        <p v-if="formError" class="text-[var(--danger)] text-[13px] -mt-1.5 mb-0">{{ formError }}</p>
        <p v-if="formSuccess" class="text-[var(--success-text)] text-[13px] -mt-1.5 mb-0">{{ formSuccess }}</p>
        <Button type="submit" :disabled="saveMutation.isPending.value" class="bg-[var(--brand)] text-white hover:opacity-90">
          {{ saveMutation.isPending.value ? "Menyimpan..." : "Catat Absen" }}
        </Button>
      </form>
    </div>

    <h2 class="text-[15px] font-semibold mb-3" style="color: var(--text-h)">Absen Manual Hari Ini</h2>
    <div v-if="!manualEntriesToday.length" class="text-[13px]" style="color: var(--muted-2)">Belum ada entri manual hari ini.</div>
    <div v-else class="card divide-y" style="border-color: var(--border)">
      <div v-for="e in manualEntriesToday" :key="e.id" class="flex items-center justify-between px-4 py-2.5">
        <div class="flex items-center gap-2">
          <span class="font-medium text-[13.5px]" style="color: var(--text-h)">{{ e.nama }}</span>
          <span class="pill" :class="e.type === 'Hadir' ? 'pill-success' : 'pill-pulang'">{{ e.type }}</span>
          <span class="text-[12px] tabular-nums" style="color: var(--muted-2)">{{ e.jam }}</span>
        </div>
        <Button variant="outline" size="sm" class="hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]" @click="deleteMutation.mutate(e.id)">Hapus</Button>
      </div>
    </div>
  </main>
</template>