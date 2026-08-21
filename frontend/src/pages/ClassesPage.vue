<script setup lang="ts">
import { ref } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { api, type ClassItem } from "../lib/api";
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

const queryClient = useQueryClient();

const { data: classes, isLoading } = useQuery({
  queryKey: ["classes"],
  queryFn: api.getClasses,
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

function openEdit(c: ClassItem) {
  editingId.value = c.id;
  form.value = { name: c.name };
  formError.value = "";
  dialogOpen.value = true;
}

const saveMutation = useMutation({
  mutationFn: (input: { name: string }) =>
    editingId.value ? api.updateClass(editingId.value, input) : api.createClass(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["classes"] });
    dialogOpen.value = false;
  },
  onError: () => {
    formError.value = "Gagal menyimpan data kelas";
  },
});

function onSubmit() {
  formError.value = "";
  if (!form.value.name) {
    formError.value = "Nama kelas wajib diisi";
    return;
  }
  saveMutation.mutate({ name: form.value.name });
}

const deleteMutation = useMutation({
  mutationFn: (id: number) => api.deleteClass(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
});

function onDelete(c: ClassItem) {
  if (confirm(`Hapus kelas "${c.name}"?`)) deleteMutation.mutate(c.id);
}
</script>

<template>
  <main class="page">
    <div class="flex items-center justify-between mb-5">
      <h1 class="!mb-0">Data Kelas</h1>
      <Button class="bg-[var(--brand)] text-white hover:opacity-90" @click="openCreate">Tambah Kelas</Button>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="isLoading" :colspan="2">Loading...</TableEmpty>
        <TableEmpty v-else-if="!classes?.length" :colspan="2">Belum ada data kelas.</TableEmpty>
        <TableRow v-for="c in classes" v-else :key="c.id">
          <TableCell>{{ c.name }}</TableCell>
          <TableCell>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="openEdit(c)">Edit</Button>
              <Button variant="destructive" size="sm" @click="onDelete(c)">Hapus</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingId ? "Edit Kelas" : "Tambah Kelas" }}</DialogTitle>
        </DialogHeader>
        <form class="flex flex-col gap-3.5" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1">
            <Label for="name">Nama</Label>
            <Input id="name" v-model="form.name" required autofocus />
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
