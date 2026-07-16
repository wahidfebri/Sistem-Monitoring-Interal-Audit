import { AuditItem } from "./types";

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
  return [];
}
