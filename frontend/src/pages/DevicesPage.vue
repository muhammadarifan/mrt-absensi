<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ref } from "vue";
import { api, type DeviceItem } from "../lib/api";

const queryClient = useQueryClient();

const { data: devices, isLoading } = useQuery({
  queryKey: ["devices"],
  queryFn: api.getDevices,
});

const dialogOpen = ref(false);
const editingId = ref<number | null>(null);
const form = ref<{ name: string }>({ name: "" });
const formError = ref("");

function openCreate() {
  editingId.value = null;
  form.value = { name: "" };
  formError.value = "";
  dialogOpen.value = true;
}

function openEdit(d: DeviceItem) {
  editingId.value = d.id;
  form.value = { name: d.name };
  formError.value = "";
  dialogOpen.value = true;
}

const saveMutation = useMutation({
  mutationFn: (input: { name: string }) =>
    editingId.value ? api.updateDevice(editingId.value, input) : api.createDevice(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["devices"] });
    dialogOpen.value = false;
  },
  onError: () => {
    formError.value = "Gagal menyimpan data perangkat";
  },
});

function onSubmit() {
  formError.value = "";
  if (!form.value.name) {
    formError.value = "Nama perangkat wajib diisi";
    return;
  }
  saveMutation.mutate({ name: form.value.name });
}

const deleteMutation = useMutation({
  mutationFn: (id: number) => api.deleteDevice(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
});

function onDelete(d: DeviceItem) {
  if (confirm(`Hapus perangkat "${d.name}"? API key ini akan berhenti berfungsi.`)) deleteMutation.mutate(d.id);
}

function copyKey(key: string) {
  navigator.clipboard?.writeText(key);
}
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div>
        <h1>Perangkat Scan</h1>
        <p>
          Arduino/ESP panggil <code>POST /api/devices/&lt;id&gt;/scan</code> dengan header
          <code>X-Device-Key</code> berisi API Key di bawah.
        </p>
      </div>
      <Button class="bg-[var(--brand)] text-white hover:opacity-90" @click="openCreate">Tambah Perangkat</Button>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Device ID</TableHead>
          <TableHead>API Key</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="4">Loading...</TableEmpty>
        <TableEmpty v-else-if="!devices?.length" :colspan="4">
          <div class="flex flex-col items-center gap-1 py-3 text-[var(--muted-2)]">
            <span class="text-[13px]">Belum ada perangkat terdaftar</span>
            <span class="text-[11.5px]">Tambah perangkat untuk dapat API Key</span>
          </div>
        </TableEmpty>
        <TableRow v-for="d in devices" v-else :key="d.id">
          <TableCell class="font-medium" style="color: var(--text-h)">{{ d.name }}</TableCell>
          <TableCell class="tabular-nums text-[var(--muted-2)]">{{ d.id }}</TableCell>
          <TableCell>
            <button
              class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono transition-colors hover:bg-[var(--surface-soft)]"
              style="border: 1px solid var(--border); color: var(--text)"
              title="Klik untuk copy"
              @click="copyKey(d.apiKey)"
            >
              {{ d.apiKey.slice(0, 8) }}...{{ d.apiKey.slice(-4) }}
            </button>
          </TableCell>
          <TableCell>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="openEdit(d)">Edit</Button>
              <Button variant="destructive" size="sm" class="hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]" @click="onDelete(d)">Hapus</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingId ? "Edit Perangkat" : "Tambah Perangkat" }}</DialogTitle>
        </DialogHeader>
        <form class="flex flex-col gap-3.5" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1">
            <Label for="name">Nama</Label>
            <Input id="name" v-model="form.name" required autofocus placeholder="mis. Gerbang Utama" />
          </div>
          <p v-if="formError" class="text-[var(--danger)] text-[13px] -mt-1.5 mb-0">{{ formError }}</p>
          <DialogFooter>
            <Button type="submit" :disabled="saveMutation.isPending.value" class="bg-[var(--brand)] text-white hover:opacity-90">
              {{ saveMutation.isPending.value ? "Menyimpan..." : "Simpan" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </main>
</template>