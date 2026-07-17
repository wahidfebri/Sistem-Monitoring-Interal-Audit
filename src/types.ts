export type AuditStatus = "Selesai" | "On Progress" | "Void";

export interface AuditItem {
  id: string | number;
  auditor: string;
  periodeAwal: string;
  periodeAkhir: string;
  region: string;
  wilayah: string;
  jenis: string;
  temuan: string;
  kondisi: string;
  penyebab: string;
  risiko: string;
  rekomendasi: string;
  plan: string;
  sop: string;
  sk: string;
  status: AuditStatus;
}

export type SanctionStatus = "Active" | "Inactive" | "Terminated";

export interface SanctionItem {
  id: string | number;
  auditor: string;
  periodeAwal: string;
  periodeAkhir: string;
  region: string;
  wilayah: string;
  namaPic: string;
  jenisTemuan: string;
  rekomendasiSanksi: string;
  implementasiSanksi: string;
  catatanTambahan: string;
  statusSanksi: SanctionStatus;
}
