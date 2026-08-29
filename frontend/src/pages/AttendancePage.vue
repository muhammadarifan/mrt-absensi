<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { api, type Rules } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);
const queryClient = useQueryClient();

const { data: attendance, isLoading, error } = useQuery({
  queryKey: ["attendance", today],
  queryFn: () => api.getAttendance(today),
});

const { data: rules } = useQuery({
  queryKey: ["rules"],
  queryFn: api.getRules,
});

const hadirCount = computed(() => attendance.value?.filter((r: any) => r.attendance.type === "hadir" && r.attendance.status === "hadir").length ?? 0);
const telatCount = computed(() => attendance.value?.filter((r: any) => r.attendance.status === "telat").length ?? 0);
const pulangCount = computed(() => attendance.value?.filter((r: any) => r.attendance.type === "pulang").length ?? 0);

const modeMutation = useMutation({
  mutationFn: (manualMode: Rules["manualMode"]) => api.updateRules({ manualMode }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
});

const scheduleOpen = ref(false);
const scheduleForm = ref({ checkinStart: "", lateAfter: "", checkoutStart: "", checkoutEnd: "" });

watch(
  rules,
  (r) => {
    if (r) {
      scheduleForm.value = {
        checkinStart: r.checkinStart,
        lateAfter: r.lateAfter,
        checkoutStart: r.checkoutStart,
        checkoutEnd: r.checkoutEnd,
      };
    }
  },
  { immediate: true }
);

const scheduleMutation = useMutation({
  mutationFn: () => api.updateRules(scheduleForm.value),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["rules"] });
    scheduleOpen.value = false;
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => api.deleteAttendance(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", today] }),
});

function onDelete(row: any) {
  if (confirm(`Hapus absensi "${row.students.name}"?`)) deleteMutation.mutate(row.attendance.id);
}

function pillClass(row: any) {
  if (row.attendance.status === "telat") return "pill-late";
  if (row.attendance.type === "pulang") return "pill-pulang";
  return "pill-success";
}
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div>
        <h1>Absensi Hari Ini</h1>
        <p>{{ today }}</p>
      </div>
    </div>

    <div class="mode-bar">
      <span class="text-[13px] font-medium" style="color: var(--text-h)">Mode Absen:</span>
      <button
        class="mode-btn"
        :class="{ active: rules?.manualMode === 'auto' }"
        @click="modeMutation.mutate('auto')"
      >
        Otomatis
      </button>
      <button
        class="mode-btn"
        :class="{ active: rules?.manualMode === 'hadir' }"
        @click="modeMutation.mutate('hadir')"
      >
        Paksa Hadir
      </button>
      <button
        class="mode-btn"
        :class="{ active: rules?.manualMode === 'pulang' }"
        @click="modeMutation.mutate('pulang')"
      >
        Paksa Pulang
      </button>
      <span v-if="rules?.manualMode !== 'auto'" class="text-[12px]" style="color: var(--danger)">
        ⚠ Override aktif — semua tap dicatat sebagai {{ rules?.manualMode }}
      </span>
      <Button variant="ghost" size="sm" class="ml-auto text-[13px]" @click="scheduleOpen = !scheduleOpen">
        {{ scheduleOpen ? "Tutup" : "Atur Jadwal" }}
      </Button>
    </div>

    <div v-if="scheduleOpen" class="card p-4 mb-5 flex flex-wrap gap-4 items-end">
      <div class="flex flex-col gap-1">
        <Label class="text-[12px]">Mulai Hadir</Label>
        <Input v-model="scheduleForm.checkinStart" type="time" class="w-28" />
      </div>
      <div class="flex flex-col gap-1">
        <Label class="text-[12px]">Batas Telat</Label>
        <Input v-model="scheduleForm.lateAfter" type="time" class="w-28" />
      </div>
      <div class="flex flex-col gap-1">
        <Label class="text-[12px]">Mulai Pulang</Label>
        <Input v-model="scheduleForm.checkoutStart" type="time" class="w-28" />
      </div>
      <div class="flex flex-col gap-1">
        <Label class="text-[12px]">Batas Pulang</Label>
        <Input v-model="scheduleForm.checkoutEnd" type="time" class="w-28" />
      </div>
      <Button
        size="sm"
        class="bg-[var(--brand)] text-white hover:opacity-90"
        :disabled="scheduleMutation.isPending.value"
        @click="scheduleMutation.mutate()"
      >
        {{ scheduleMutation.isPending.value ? "Menyimpan..." : "Simpan Jadwal" }}
      </Button>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="stat-card">
        <div class="label">Hadir</div>
        <div class="value" style="color: var(--success-text)">{{ hadirCount }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Telat</div>
        <div class="value" style="color: var(--late-text)">{{ telatCount }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Pulang</div>
        <div class="value" style="color: var(--brand)">{{ pulangCount }}</div>
      </div>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Jam Scan</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="5">Memuat data...</TableEmpty>
        <TableEmpty v-else-if="error" :colspan="5">Gagal memuat data.</TableEmpty>
        <TableEmpty v-else-if="!attendance?.length" :colspan="5">
          <div class="flex flex-col items-center gap-1 py-3 text-[var(--muted-2)]">
            <span class="text-[13px]">Belum ada yang absen hari ini</span>
            <span class="text-[11.5px]">Data otomatis muncul begitu ada kartu di-tap</span>
          </div>
        </TableEmpty>
        <TableRow v-for="row in attendance" v-else :key="row.attendance.id">
          <TableCell class="font-medium" style="color: var(--text-h)">{{ row.students.name }}</TableCell>
          <TableCell class="tabular-nums text-[var(--muted-2)]">{{ row.attendance.scannedAt }}</TableCell>
          <TableCell>
            <span class="pill" :class="row.attendance.type === 'pulang' ? 'pill-pulang' : 'pill-success'">
              {{ row.attendance.type === "pulang" ? "Pulang" : "Hadir" }}
            </span>
          </TableCell>
          <TableCell>
            <span class="pill" :class="pillClass(row)">{{ row.attendance.status }}</span>
          </TableCell>
          <TableCell>
            <Button variant="outline" size="sm" class="hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] hover:border-[var(--danger)]" @click="onDelete(row)">
              Hapus
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </main>
</template>