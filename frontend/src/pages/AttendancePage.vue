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

const { data: classes } = useQuery({
  queryKey: ["classes"],
  queryFn: api.getClasses,
});

const { data: rules } = useQuery({
  queryKey: ["rules"],
  queryFn: api.getRules,
});

const classNameById = computed(() => {
  const map = new Map<number, string>();
  for (const c of classes.value ?? []) map.set(c.id, c.name);
  return map;
});

const hadirCount = computed(() => attendance.value?.filter((r) => r.hadir).length ?? 0);
const telatCount = computed(() => attendance.value?.filter((r) => r.hadir?.status === "telat").length ?? 0);
const pulangCount = computed(() => attendance.value?.filter((r) => r.pulang).length ?? 0);

const search = ref("");
const statusFilter = ref<"semua" | "sudah_hadir" | "sudah_pulang" | "belum_absen">("semua");
const sortBy = ref<"nama" | "jam">("nama");

const visibleRows = computed(() => {
  let rows = attendance.value ?? [];

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    rows = rows.filter((r) => r.student.name.toLowerCase().includes(q));
  }

  if (statusFilter.value === "sudah_hadir") rows = rows.filter((r) => r.hadir);
  else if (statusFilter.value === "sudah_pulang") rows = rows.filter((r) => r.pulang);
  else if (statusFilter.value === "belum_absen") rows = rows.filter((r) => !r.hadir && !r.pulang);

  rows = [...rows].sort((a, b) => {
    if (sortBy.value === "nama") return a.student.name.localeCompare(b.student.name);
    const ta = a.hadir?.scannedAt ?? a.pulang?.scannedAt ?? "";
    const tb = b.hadir?.scannedAt ?? b.pulang?.scannedAt ?? "";
    return tb.localeCompare(ta);
  });

  return rows;
});


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

function onDelete(id: number, nama: string, tipe: string) {
  if (confirm(`Hapus absen ${tipe} "${nama}"?`)) deleteMutation.mutate(id);
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
      <button class="mode-btn" :class="{ active: rules?.manualMode === 'auto' }" @click="modeMutation.mutate('auto')">Otomatis</button>
      <button class="mode-btn" :class="{ active: rules?.manualMode === 'hadir' }" @click="modeMutation.mutate('hadir')">Paksa Hadir</button>
      <button class="mode-btn" :class="{ active: rules?.manualMode === 'pulang' }" @click="modeMutation.mutate('pulang')">Paksa Pulang</button>
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
        <Label class="text-[12px]">Batas Pulang (di luar ini = wajib manual)</Label>
        <Input v-model="scheduleForm.checkoutEnd" type="time" class="w-28" />
      </div>
      <Button size="sm" class="bg-[var(--brand)] text-white hover:opacity-90" :disabled="scheduleMutation.isPending.value" @click="scheduleMutation.mutate()">
        {{ scheduleMutation.isPending.value ? "Menyimpan..." : "Simpan Jadwal" }}
      </Button>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="stat-card">
        <div class="label">Sudah Hadir</div>
        <div class="value" style="color: var(--success-text)">{{ hadirCount }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Telat</div>
        <div class="value" style="color: var(--late-text)">{{ telatCount }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Sudah Pulang</div>
        <div class="value" style="color: var(--brand)">{{ pulangCount }}</div>
      </div>
    </div>

    <div class="toolbar">
      <Input v-model="search" placeholder="Cari nama siswa..." class="max-w-[240px]" />
      <Select v-model="statusFilter">
        <SelectTrigger class="w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="semua">Semua</SelectItem>
          <SelectItem value="sudah_hadir">Sudah Hadir</SelectItem>
          <SelectItem value="sudah_pulang">Sudah Pulang</SelectItem>
          <SelectItem value="belum_absen">Belum Absen</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="sortBy">
        <SelectTrigger class="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nama">Urut: Nama A-Z</SelectItem>
          <SelectItem value="jam">Urut: Terbaru</SelectItem>
        </SelectContent>
      </Select>
      <span class="text-[12.5px] ml-auto" style="color: var(--muted-2)">{{ visibleRows.length }} siswa</span>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Kelas</TableHead>
          <TableHead>Hadir</TableHead>
          <TableHead>Pulang</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="5">Memuat data...</TableEmpty>
        <TableEmpty v-else-if="error" :colspan="5">Gagal memuat data.</TableEmpty>
        <TableEmpty v-else-if="!visibleRows.length" :colspan="5">Gak ada siswa yang cocok.</TableEmpty>
        <TableRow v-for="row in visibleRows" v-else :key="row.student.id">
          <TableCell class="font-medium" style="color: var(--text-h)">{{ row.student.name }}</TableCell>
          <TableCell class="text-[var(--muted-2)]">{{ classNameById.get(row.student.classId) ?? "-" }}</TableCell>
          <TableCell>
            <div v-if="row.hadir" class="flex items-center gap-1.5">
              <span class="pill" :class="row.hadir.status === 'telat' ? 'pill-late' : 'pill-success'">
                {{ row.hadir.status === "telat" ? "Telat" : "Hadir" }}
              </span>
              <span class="text-[11.5px] tabular-nums" style="color: var(--muted-2)">
                {{ row.hadir.scannedAt.slice(11, 16) }}
              </span>
              <button class="cell-x" title="Hapus" @click="onDelete(row.hadir.id, row.student.name, 'Hadir')">×</button>
            </div>
            <span v-else class="cell-empty">belum absen</span>
          </TableCell>
          <TableCell>
            <div v-if="row.pulang" class="flex items-center gap-1.5">
              <span class="pill pill-pulang">Pulang</span>
              <span class="text-[11.5px] tabular-nums" style="color: var(--muted-2)">
                {{ row.pulang.scannedAt.slice(11, 16) }}
              </span>
              <button class="cell-x" title="Hapus" @click="onDelete(row.pulang.id, row.student.name, 'Pulang')">×</button>
            </div>
            <span v-else class="cell-empty">belum absen</span>
          </TableCell>
          <TableCell>
            <router-link to="/absen-manual" class="text-[12.5px]" style="color: var(--brand)">+ Manual</router-link>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </main>
</template>