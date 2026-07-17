import { AuditItem, SanctionItem } from "./types";

export const regionMapping: Record<string, string[]> = {
  "Sumatera": ["Tanjung Pinang", "Medan", "Pemantang Siantar", "Padang", "Rantau Prapat", "Batam", "Bukit Tinggi", "Pekanbaru", "Lampung", "Palembang", "Pangkal Pinang", "Jambi"],
  "Jabarteng": ["Karawang", "Bandung", "Cirebon", "Purwokerto", "Semarang", "Yogyakarta"],
  "Jabodetabek": ["Cisauk", "Tangerang Selatan", "Depok", "Bekasi", "Jakarta"],
  "Jatim Bali Nusra": ["Mataram", "Kupang", "Manggarai", "Kediri", "Surabaya", "Malang", "Denpasar"],
  "Kalimantan": ["Sintang", "Pontianak", "Ketapang", "Pangkalan Bun", "Sampit", "Palangkaraya", "Tanah Bumbu", "Banjarmasin", "Balikpapan", "Samarinda", "Bontang", "Berau", "Paser"],
  "Sulawesi": ["Makassar", "Palopo", "Pare Pare", "Kendari", "Palu", "Gorontalo", "Manado", "Kotamobagu", "Luwu Timur", "Luwuk Banggai", "Mamuju"],
  "Ampa": ["Ternate", "Tobelo", "Ambon", "Maluku Tengah", "Sorong", "Manokwari", "Biak", "Nabire", "Jayapura", "Merauke"]
};

export function generateAuditData(): AuditItem[] {
  return [
    {
      id: 1,
      auditor: "Andi Wijaya",
      periodeAwal: "01/06/2026",
      periodeAkhir: "15/06/2026",
      region: "Jabodetabek",
      wilayah: "Jakarta",
      jenis: "Operasional",
      temuan: "Selisih stock opname barang inventaris di gudang utama sebesar 5%.",
      kondisi: "Petugas gudang tidak melakukan pencatatan harian secara tertib.",
      penyebab: "Ketiadaan form check-list fisik dan kurangnya pengawasan supervisor.",
      risiko: "Potensi kehilangan aset perusahaan dan ketidakakuratan laporan keuangan.",
      rekomendasi: "Terapkan logbook digital harian dan lakukan audit fisik mingguan.",
      plan: "Mengimplementasikan sistem pencatatan inventaris berbasis QR-Code.",
      sop: "SOP-LOG-012 tentang Manajemen Inventaris",
      sk: "SK-Dir-044/2025 tentang Pengawasan Aset",
      status: "On Progress"
    },
    {
      id: 2,
      auditor: "Siti Rahma",
      periodeAwal: "10/05/2026",
      periodeAkhir: "25/05/2026",
      region: "Jatim Bali Nusra",
      wilayah: "Surabaya",
      jenis: "Kepatuhan",
      temuan: "Keterlambatan penyerahan laporan kepatuhan pajak daerah masa April 2026.",
      kondisi: "Laporan baru dikirimkan pada tanggal 20 Mei (batas maksimal tanggal 15).",
      penyebab: "Keterlambatan rekonsiliasi data transaksi dari cabang pembantu.",
      risiko: "Denda administratif dari dinas perpajakan daerah.",
      rekomendasi: "Jadwalkan rekonsiliasi otomatis setiap tanggal 5 bulan berikutnya.",
      plan: "Menggunakan modul pelaporan otomatis terintegrasi.",
      sop: "SOP-TAX-003 tentang Pelaporan Pajak Daerah",
      sk: "SK-TAX-2026-05",
      status: "Selesai"
    },
    {
      id: 3,
      auditor: "Budi Santoso",
      periodeAwal: "20/06/2026",
      periodeAkhir: "30/06/2026",
      region: "Sumatera",
      wilayah: "Medan",
      jenis: "Sistem Informasi",
      temuan: "Akses login admin pada komputer cabang belum menggunakan otentikasi dua faktor (2FA).",
      kondisi: "Password akun masih standar dan tidak berkala diubah.",
      penyebab: "Sistem IT lokal belum dikonfigurasi wajib MFA oleh pusat.",
      risiko: "Kerentanan terhadap serangan cyber (unauthorized access) pada sistem internal.",
      rekomendasi: "Wajibkan instalasi Google Authenticator untuk seluruh akun kantor cabang.",
      plan: "Mulai integrasi MFA menggunakan middleware keamanan pusat per Juli 2026.",
      sop: "SOP-IT-088 tentang Standar Keamanan Akun",
      sk: "SK-IT-SEC-2025-11",
      status: "On Progress"
    }
  ];
}

export function generateSanctionData(): SanctionItem[] {
  return [
    {
      id: 1,
      auditor: "Andi Wijaya",
      periodeAwal: "01/06/2026",
      periodeAkhir: "15/06/2026",
      region: "Jabodetabek",
      wilayah: "Jakarta",
      namaPic: "Budi Setiawan",
      jenisTemuan: "Operasional",
      rekomendasiSanksi: "Teguran Tertulis I dan kewajiban mengikuti pelatihan ulang SOP Inventarisasi.",
      implementasiSanksi: "Teguran Tertulis I telah diterbitkan oleh HRD dan ditandatangani oleh PIC.",
      catatanTambahan: "PIC bersikap kooperatif dan berkomitmen untuk memperbaiki pencatatan stock opname.",
      statusSanksi: "Terminated"
    },
    {
      id: 2,
      auditor: "Siti Rahma",
      periodeAwal: "10/05/2026",
      periodeAkhir: "25/05/2026",
      region: "Jatim Bali Nusra",
      wilayah: "Surabaya",
      namaPic: "Dewi Lestari",
      jenisTemuan: "Kepatuhan",
      rekomendasiSanksi: "Pemotongan insentif keterlambatan pelaporan dan Surat Peringatan I.",
      implementasiSanksi: "Proses koordinasi dengan pihak HRD untuk penyesuaian payroll bulan ini.",
      catatanTambahan: "Keterlambatan berulang untuk kedua kalinya di kuartal ini.",
      statusSanksi: "Active"
    }
  ];
}

