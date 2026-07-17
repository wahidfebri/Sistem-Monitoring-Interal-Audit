import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  SlidersHorizontal, 
  FolderCheck, 
  FileSpreadsheet, 
  FileText, 
  Keyboard, 
  Search, 
  MapPin, 
  Upload, 
  Plus, 
  X, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info, 
  Settings2,
  Calendar,
  AlertCircle,
  Lock,
  Unlock,
  Trash2,
  LogOut,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Scale,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { regionMapping } from "./data";
import { AuditItem, AuditStatus, SanctionItem, SanctionStatus } from "./types";

// Helper function to format any date string to DD/MM/YYYY
function formatDateToDMY(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  
  const cleanStr = dateStr.trim();
  if (cleanStr === "" || cleanStr === "-") return "-";

  // Check if it is an Excel serial number (usually 5 digits)
  if (/^\d{5}$/.test(cleanStr)) {
    const serial = Number(cleanStr);
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400000);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Check if it matches DD-MM-YY or DD/MM/YY (where year is 2-digit)
  const dmy2DigitMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (dmy2DigitMatch) {
    const [_, day, month, year2] = dmy2DigitMatch;
    const fullYear = "20" + year2;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${fullYear}`;
  }

  // Check if it matches DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [_, day, month, year] = dmyMatch;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  // Check if it matches YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [_, year, month, day] = ymdMatch;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  // Try parsing with Date constructor
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return cleanStr;
}

// Helper function to convert any date string format to YYYY-MM-DD for date inputs
function formatDateToYMD(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const cleanStr = dateStr.trim();
  if (cleanStr === "" || cleanStr === "-") return "";

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    return cleanStr.substring(0, 10);
  }

  // Handle Excel serial number (usually 5 digits)
  if (/^\d{5}$/.test(cleanStr)) {
    const serial = Number(cleanStr);
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // If in DD-MM-YY or DD/MM/YY (where year is 2 digits)
  const dmy2DigitMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (dmy2DigitMatch) {
    const [_, d, m, y2] = dmy2DigitMatch;
    const fullYear = "20" + y2;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // If in DD-MM-YYYY or DD/MM/YYYY format (where year is 4 digits)
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [_, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Parse using Date constructor
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return "";
}

// Helper function to convert date string to numerical timestamp for sorting
function parseToTimestamp(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const cleanStr = dateStr.trim();
  if (cleanStr === "" || cleanStr === "-") return 0;

  // Check DD/MM/YYYY
  const dmyMatch = cleanStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    const [_, day, month, year] = dmyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  // Check YYYY-MM-DD
  const ymdMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [_, year, month, day] = ymdMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.getTime();
  }

  return 0;
}

export default function App() {
  // Authentication states
  const [userRole, setUserRole] = useState<"viewer" | "admin" | null>(() => {
    const saved = localStorage.getItem("audit_user_role");
    return (saved === "viewer" || saved === "admin") ? saved : null;
  });
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  // State variables
  const [activeTab, setActiveTab] = useState<"monitoring" | "input" | "sanksi" | "input_sanksi">("monitoring");
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => localStorage.getItem("siams_standalone_mode") === "true");
  
  // Sanctions state variables
  const [sanctions, setSanctions] = useState<SanctionItem[]>([]);
  const [loadingSanctions, setLoadingSanctions] = useState<boolean>(true);
  
  // Delete Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<boolean>(false);
  
  // Sanctions delete confirmation state
  const [confirmDeleteSanctionId, setConfirmDeleteSanctionId] = useState<string | number | null>(null);
  const [deletingSanction, setDeletingSanction] = useState<boolean>(false);
  
  // Filtering & search states
  const [filterRegion, setFilterRegion] = useState<string>("ALL");
  const [filterWilayah, setFilterWilayah] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Sanctions filtering & search states
  const [filterSanctionRegion, setFilterSanctionRegion] = useState<string>("ALL");
  const [filterSanctionWilayah, setFilterSanctionWilayah] = useState<string>("ALL");
  const [filterSanctionStatus, setFilterSanctionStatus] = useState<string>("ALL");
  const [searchSanctionQuery, setSearchSanctionQuery] = useState<string>("");
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<"periodeAwal" | "periodeAkhir" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "periodeAwal" | "periodeAkhir") => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
        showToast(`Mengurutkan ${column === "periodeAwal" ? "Periode Awal" : "Periode Akhir"} secara menurun (baru ke lama).`, "info");
      } else {
        setSortColumn(null);
        showToast("Urutan tanggal dinonaktifkan.", "info");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
      showToast(`Mengurutkan ${column === "periodeAwal" ? "Periode Awal" : "Periode Akhir"} secara menaik (lama ke baru).`, "info");
    }
  };
  
  // Manual input form states
  const [formAuditor, setFormAuditor] = useState<string>("");
  const [formPeriodeAwal, setFormPeriodeAwal] = useState<string>("");
  const [formPeriodeAkhir, setFormPeriodeAkhir] = useState<string>("");
  const [formRegion, setFormRegion] = useState<string>("");
  const [formWilayah, setFormWilayah] = useState<string>("");
  const [formJenis, setFormJenis] = useState<string>("");
  const [formTemuan, setFormTemuan] = useState<string>("");
  const [formKondisi, setFormKondisi] = useState<string>("");
  const [formPenyebab, setFormPenyebab] = useState<string>("");
  const [formRisiko, setFormRisiko] = useState<string>("");
  const [formRekomendasi, setFormRekomendasi] = useState<string>("");
  const [formPlan, setFormPlan] = useState<string>("");
  const [formSop, setFormSop] = useState<string>("");
  const [formSk, setFormSk] = useState<string>("");
  const [formStatus, setFormStatus] = useState<AuditStatus>("On Progress");

  // Sanctions manual input form states
  const [formSanctionAuditor, setFormSanctionAuditor] = useState<string>("");
  const [formSanctionPeriodeAwal, setFormSanctionPeriodeAwal] = useState<string>("");
  const [formSanctionPeriodeAkhir, setFormSanctionPeriodeAkhir] = useState<string>("");
  const [formSanctionRegion, setFormSanctionRegion] = useState<string>("");
  const [formSanctionWilayah, setFormSanctionWilayah] = useState<string>("");
  const [formSanctionNamaPic, setFormSanctionNamaPic] = useState<string>("");
  const [formSanctionJenisTemuan, setFormSanctionJenisTemuan] = useState<string>("");
  const [formSanctionRekomendasiSanksi, setFormSanctionRekomendasiSanksi] = useState<string>("");
  const [formSanctionImplementasiSanksi, setFormSanctionImplementasiSanksi] = useState<string>("");
  const [formSanctionCatatanTambahan, setFormSanctionCatatanTambahan] = useState<string>("");
  const [formSanctionStatusSanksi, setFormSanctionStatusSanksi] = useState<SanctionStatus>("Active");

  // Sanction management modal states
  const [selectedSanction, setSelectedSanction] = useState<SanctionItem | null>(null);
  const [editSanctionForm, setEditSanctionForm] = useState<SanctionItem | null>(null);
  const [updatingSanction, setUpdatingSanction] = useState<boolean>(false);

  // Excel Upload state
  const [excelDragOver, setExcelDragOver] = useState<boolean>(false);
  const [showExcelRuleDialog, setShowExcelRuleDialog] = useState<boolean>(false);
  const [showExcelSanctionRuleDialog, setShowExcelSanctionRuleDialog] = useState<boolean>(false);

  // Status management modal states
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(null);
  const [editForm, setEditForm] = useState<AuditItem | null>(null);
  const [modalStatus, setModalStatus] = useState<AuditStatus>("On Progress");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Non-blocking in-app notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Column widths state for drag-to-resize columns
  const [colWidths, setColWidths] = useState({
    auditor: 155,
    periodeAwal: 110,
    periodeAkhir: 110,
    region: 170,
    jenis: 140,
    temuan: 260,
    kondisi: 480,    // Wide by default (for long chronologies/kondisi)
    penyebab: 420,   // Wide by default (for long penyebab)
    risiko: 110,
    rekomendasi: 260,
    plan: 260,
    sop: 320,        // Wide by default (for SOP/SK/IOM)
    status: 160
  });

  const [resizingCol, setResizingCol] = useState<string | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent, column: keyof typeof colWidths) => {
    e.preventDefault();
    setResizingCol(column);
    const startX = e.clientX;
    const startWidth = colWidths[column];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const difference = currentX - startX;
      setColWidths(prev => ({
        ...prev,
        [column]: Math.max(70, startWidth + difference)
      }));
    };

    const handleMouseUp = () => {
      setResizingCol(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const resetColumnWidths = () => {
    setColWidths({
      auditor: 155,
      periodeAwal: 110,
      periodeAkhir: 110,
      region: 170,
      jenis: 140,
      temuan: 260,
      kondisi: 480,
      penyebab: 420,
      risiko: 110,
      rekomendasi: 260,
      plan: 260,
      sop: 320,
      status: 160
    });
    showToast("Ukuran kolom berhasil dikembalikan ke semula.", "info");
  };

  // Auto-dismiss toast helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Helper to switch to standalone client-side mode
  const switchToStandalone = () => {
    setIsStandalone(true);
    localStorage.setItem("siams_standalone_mode", "true");
    const localData = localStorage.getItem("siams_standalone_audits");
    if (localData) {
      try {
        setAudits(JSON.parse(localData));
      } catch (e) {
        setAudits([]);
      }
    } else {
      setAudits([]);
      localStorage.setItem("siams_standalone_audits", JSON.stringify([]));
    }

    const localSanctions = localStorage.getItem("siams_standalone_sanctions");
    if (localSanctions) {
      try {
        setSanctions(JSON.parse(localSanctions));
      } catch (e) {
        setSanctions([]);
      }
    } else {
      setSanctions([]);
      localStorage.setItem("siams_standalone_sanctions", JSON.stringify([]));
    }
  };

  // Fetch audits on load
  const fetchAudits = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audits");
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
        setIsStandalone(false);
        localStorage.setItem("siams_standalone_mode", "false");
      } else {
        switchToStandalone();
      }
    } catch (error) {
      switchToStandalone();
    } finally {
      setLoading(false);
    }
  };

  // Fetch sanctions on load
  const fetchSanctions = async () => {
    try {
      setLoadingSanctions(true);
      const res = await fetch("/api/sanctions");
      if (res.ok) {
        const data = await res.json();
        setSanctions(data);
      } else {
        const localSanctions = localStorage.getItem("siams_standalone_sanctions");
        if (localSanctions) {
          try {
            setSanctions(JSON.parse(localSanctions));
          } catch (e) {
            setSanctions([]);
          }
        } else {
          setSanctions([]);
        }
      }
    } catch (err) {
      const localSanctions = localStorage.getItem("siams_standalone_sanctions");
      if (localSanctions) {
        try {
          setSanctions(JSON.parse(localSanctions));
        } catch (e) {
          setSanctions([]);
        }
      } else {
        setSanctions([]);
      }
    } finally {
      setLoadingSanctions(false);
    }
  };

  useEffect(() => {
    fetchAudits();
    fetchSanctions();
  }, []);

  // Sync modal local status and edit form state when an audit item is selected
  useEffect(() => {
    if (selectedAudit) {
      setModalStatus(selectedAudit.status);
      setEditForm({ ...selectedAudit });
    } else {
      setEditForm(null);
    }
  }, [selectedAudit]);

  // Sync modal local status and edit form state when a sanction item is selected
  useEffect(() => {
    if (selectedSanction) {
      setEditSanctionForm({ ...selectedSanction });
    } else {
      setEditSanctionForm(null);
    }
  }, [selectedSanction]);

  // Authentication logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const id = usernameInput.trim();
    const pass = passwordInput;

    if (id === "auditinternal" && pass === "sitama1005") {
      setUserRole("viewer");
      localStorage.setItem("audit_user_role", "viewer");
      localStorage.setItem("audit_user_id", "auditinternal");
      showToast("Berhasil login sebagai Auditor Viewer.", "success");
      setUsernameInput("");
      setPasswordInput("");
    } else if (id === "auditinternaladmin" && pass === "audit1005") {
      setUserRole("admin");
      localStorage.setItem("audit_user_role", "admin");
      localStorage.setItem("audit_user_id", "auditinternaladmin");
      showToast("Berhasil login sebagai Super User Admin.", "success");
      setUsernameInput("");
      setPasswordInput("");
    } else {
      setLoginError("ID Pengguna atau Password salah. Silakan coba lagi.");
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("audit_user_role");
    localStorage.removeItem("audit_user_id");
    showToast("Anda telah keluar dari sesi audit.", "info");
    setActiveTab("monitoring");
  };

  // Action: Delete an audit item via DELETE API
  const handleDeleteAudit = async (id: string | number) => {
    setDeletingId(true);
    if (isStandalone) {
      const updated = audits.filter(a => a.id !== id);
      setAudits(updated);
      localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
      showToast("Laporan hasil temuan audit berhasil dihapus secara lokal.", "success");
      setConfirmDeleteId(null);
      setDeletingId(false);
      return;
    }

    try {
      const res = await fetch(`/api/audits/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAudits(prev => prev.filter(a => a.id !== id));
        showToast("Laporan hasil temuan audit berhasil dihapus secara permanen.", "success");
        setConfirmDeleteId(null);
      } else {
        showToast("Gagal menghapus dari server. Menghapus secara lokal...", "info");
        const updated = audits.filter(a => a.id !== id);
        setAudits(updated);
        localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
        setIsStandalone(true);
        localStorage.setItem("siams_standalone_mode", "true");
        setConfirmDeleteId(null);
      }
    } catch (err) {
      showToast("Gagal berkomunikasi dengan server. Menghapus secara lokal...", "info");
      const updated = audits.filter(a => a.id !== id);
      setAudits(updated);
      localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
      setIsStandalone(true);
      localStorage.setItem("siams_standalone_mode", "true");
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(false);
    }
  };

  // Action: Delete a sanction item via DELETE API
  const handleDeleteSanction = async (id: string | number) => {
    setDeletingSanction(true);
    if (isStandalone) {
      const updated = sanctions.filter(s => s.id !== id);
      setSanctions(updated);
      localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
      showToast("Rekomendasi sanksi berhasil dihapus secara lokal.", "success");
      setConfirmDeleteSanctionId(null);
      setDeletingSanction(false);
      return;
    }

    try {
      const res = await fetch(`/api/sanctions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSanctions(prev => prev.filter(s => s.id !== id));
        showToast("Rekomendasi sanksi berhasil dihapus secara permanen.", "success");
        setConfirmDeleteSanctionId(null);
      } else {
        showToast("Gagal menghapus dari server. Menghapus secara lokal...", "info");
        const updated = sanctions.filter(s => s.id !== id);
        setSanctions(updated);
        localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
        setIsStandalone(true);
        localStorage.setItem("siams_standalone_mode", "true");
        setConfirmDeleteSanctionId(null);
      }
    } catch (err) {
      showToast("Gagal berkomunikasi dengan server. Menghapus secara lokal...", "info");
      const updated = sanctions.filter(s => s.id !== id);
      setSanctions(updated);
      localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
      setIsStandalone(true);
      localStorage.setItem("siams_standalone_mode", "true");
      setConfirmDeleteSanctionId(null);
    } finally {
      setDeletingSanction(false);
    }
  };

  // Handle region filter change and automatically reset wilayah
  const handleRegionFilterChange = (val: string) => {
    setFilterRegion(val);
    setFilterWilayah("ALL");
  };

  // Handle sanction region filter change and automatically reset wilayah
  const handleSanctionRegionFilterChange = (val: string) => {
    setFilterSanctionRegion(val);
    setFilterSanctionWilayah("ALL");
  };

  // Handle manual region form change and automatically pre-fill the first town
  const handleFormRegionChange = (val: string) => {
    setFormRegion(val);
    const cities = regionMapping[val];
    if (cities && cities.length > 0) {
      setFormWilayah(cities[0]);
    } else {
      setFormWilayah("");
    }
  };

  // Handle manual sanction region form change and automatically pre-fill the first town
  const handleSanctionFormRegionChange = (val: string) => {
    setFormSanctionRegion(val);
    const cities = regionMapping[val];
    if (cities && cities.length > 0) {
      setFormSanctionWilayah(cities[0]);
    } else {
      setFormSanctionWilayah("");
    }
  };

  // KPI Calculations
  const totalFindingsCount = audits.length;
  const selesaiCount = audits.filter(a => a.status === "Selesai").length;
  const progressCount = audits.filter(a => a.status === "On Progress").length;
  const voidCount = audits.filter(a => a.status === "Void").length;

  // Sanctions KPI Calculations
  const totalSanctionsCount = sanctions.length;
  const activeSanctionsCount = sanctions.filter(s => s.statusSanksi === "Active").length;
  const inactiveSanctionsCount = sanctions.filter(s => s.statusSanksi === "Inactive").length;
  const terminatedSanctionsCount = sanctions.filter(s => s.statusSanksi === "Terminated").length;

  // Sanctions Filter & Search Logic
  const filteredSanctions = sanctions.filter(item => {
    if (filterSanctionRegion !== "ALL" && item.region !== filterSanctionRegion) return false;
    if (filterSanctionWilayah !== "ALL" && item.wilayah !== filterSanctionWilayah) return false;
    if (filterSanctionStatus !== "ALL" && item.statusSanksi !== filterSanctionStatus) return false;
    
    if (searchSanctionQuery.trim() !== "") {
      const q = searchSanctionQuery.toLowerCase();
      const matchText = [
        item.auditor || "",
        item.periodeAwal || "",
        item.periodeAkhir || "",
        item.region || "",
        item.wilayah || "",
        item.namaPic || "",
        item.jenisTemuan || "",
        item.rekomendasiSanksi || "",
        item.implementasiSanksi || "",
        item.catatanTambahan || ""
      ].join(" ").toLowerCase();
      
      if (!matchText.includes(q)) return false;
    }
    
    return true;
  });

  // Filter & Search Logic
  const rawFiltered = audits.filter(item => {
    if (filterRegion !== "ALL" && item.region !== filterRegion) return false;
    if (filterWilayah !== "ALL" && item.wilayah !== filterWilayah) return false;
    if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchText = [
        item.auditor || "",
        item.periodeAwal || "",
        item.periodeAkhir || "",
        item.region,
        item.wilayah,
        item.jenis,
        item.temuan,
        item.kondisi,
        item.penyebab,
        item.risiko,
        item.rekomendasi,
        item.plan,
        item.sop,
        item.sk
      ].join(" ").toLowerCase();
      
      if (!matchText.includes(q)) return false;
    }
    
    return true;
  });

  const filteredAudits = [...rawFiltered];
  if (sortColumn) {
    filteredAudits.sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      const timeA = parseToTimestamp(valA);
      const timeB = parseToTimestamp(valB);

      if (sortDirection === "asc") {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });
  }

  // Action: Save updated audit item (all fields editable) via PUT API
  const handleSaveStatusUpdate = async () => {
    if (!selectedAudit || !editForm) return;

    if (
      !editForm.auditor ||
      !editForm.periodeAwal ||
      !editForm.periodeAkhir ||
      !editForm.region ||
      !editForm.wilayah ||
      !editForm.jenis ||
      !editForm.temuan ||
      !editForm.kondisi ||
      !editForm.penyebab ||
      !editForm.rekomendasi
    ) {
      showToast("Mohon lengkapi seluruh kolom wajib bertanda bintang (*).", "error");
      return;
    }

    const localForm = {
      ...editForm,
      periodeAwal: formatDateToDMY(editForm.periodeAwal),
      periodeAkhir: formatDateToDMY(editForm.periodeAkhir)
    };

    try {
      setUpdatingStatus(true);
      if (isStandalone) {
        const updated = audits.map(a => a.id === localForm.id ? localForm : a);
        setAudits(updated);
        localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
        showToast(`Data laporan audit wilayah ${localForm.wilayah} berhasil diperbarui secara lokal!`, "success");
        setSelectedAudit(null);
        return;
      }

      const res = await fetch(`/api/audits/${selectedAudit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        const updatedItem = await res.json();
        // Update local list
        setAudits(prev => prev.map(a => a.id === updatedItem.id ? updatedItem : a));
        showToast(`Data laporan audit wilayah ${updatedItem.wilayah} berhasil diperbarui secara real-time!`, "success");
        setSelectedAudit(null);
      } else {
        showToast("Gagal memperbarui di server. Memperbarui secara lokal...", "info");
        const updated = audits.map(a => a.id === localForm.id ? localForm : a);
        setAudits(updated);
        localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
        setIsStandalone(true);
        localStorage.setItem("siams_standalone_mode", "true");
        setSelectedAudit(null);
      }
    } catch (err) {
      showToast("Gagal berkomunikasi dengan server. Memperbarui secara lokal...", "info");
      const updated = audits.map(a => a.id === localForm.id ? localForm : a);
      setAudits(updated);
      localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
      setIsStandalone(true);
      localStorage.setItem("siams_standalone_mode", "true");
      setSelectedAudit(null);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Action: Export filtered audit data to Excel format
  const handleExportExcel = () => {
    if (filteredAudits.length === 0) {
      showToast("Tidak ada data audit untuk diexport.", "error");
      return;
    }
    
    try {
      // Map data to Indonesian columns with clean fallback formatting
      const exportData = filteredAudits.map((item, idx) => ({
        "No": idx + 1,
        "Auditor": item.auditor || "-",
        "Periode Awal": formatDateToDMY(item.periodeAwal),
        "Periode Akhir": formatDateToDMY(item.periodeAkhir),
        "Region": item.region || "-",
        "Wilayah": item.wilayah || "-",
        "Jenis Audit": item.jenis || "-",
        "Temuan Audit": item.temuan || "-",
        "Kondisi Permasalahan": item.kondisi || "-",
        "Penyebab Utama": item.penyebab || "-",
        "Risiko Teridentifikasi": item.risiko || "-",
        "Rekomendasi": item.rekomendasi || "-",
        "Action Plan": item.plan || "-",
        "SOP/SK/IOM Acuan": item.sop || "-",
        "Status": item.status || "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Audit");
      
      // Auto-fit column widths elegantly
      const maxLens = Object.keys(exportData[0]).map(key => {
        let maxVal = key.length;
        exportData.forEach(row => {
          const val = String((row as any)[key] || "");
          if (val.length > maxVal) {
            maxVal = val.length;
          }
        });
        return { wch: Math.min(Math.max(maxVal + 2, 8), 50) };
      });
      worksheet["!cols"] = maxLens;

      // Write and save file with dynamic timestamp
      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Laporan_Hasil_Audit_${today}.xlsx`);
      showToast("Laporan hasil audit berhasil diexport ke format Excel (.xlsx)!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengexport file Excel.", "error");
    }
  };

  // Action: Submit manual form via POST API
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAuditor || !formPeriodeAwal || !formPeriodeAkhir || !formRegion || !formWilayah || !formJenis || !formTemuan || !formKondisi || !formPenyebab || !formRekomendasi) {
      showToast("Mohon lengkapi seluruh kolom wajib bertanda bintang (*).", "error");
      return;
    }

    const payload = {
      auditor: formAuditor,
      periodeAwal: formPeriodeAwal,
      periodeAkhir: formPeriodeAkhir,
      region: formRegion,
      wilayah: formWilayah,
      jenis: formJenis,
      temuan: formTemuan,
      kondisi: formKondisi,
      penyebab: formPenyebab,
      risiko: formRisiko || "-",
      rekomendasi: formRekomendasi,
      plan: formPlan || "-",
      sop: formSop || "-",
      sk: formSk || "-",
      status: formStatus
    };

    const localPayload = {
      ...payload,
      id: Date.now(),
      periodeAwal: formatDateToDMY(formPeriodeAwal),
      periodeAkhir: formatDateToDMY(formPeriodeAkhir)
    };

    const resetForm = () => {
      setFormAuditor("");
      setFormPeriodeAwal("");
      setFormPeriodeAkhir("");
      setFormRegion("");
      setFormWilayah("");
      setFormJenis("");
      setFormTemuan("");
      setFormKondisi("");
      setFormPenyebab("");
      setFormRisiko("");
      setFormRekomendasi("");
      setFormPlan("");
      setFormSop("");
      setFormSk("");
      setFormStatus("On Progress");
      setActiveTab("monitoring");
    };

    if (isStandalone) {
      const updated = [localPayload, ...audits];
      setAudits(updated);
      localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
      showToast(`Laporan hasil audit untuk wilayah ${formWilayah} berhasil disimpan secara lokal!`, "success");
      resetForm();
      return;
    }

    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newlyAdded = await res.json();
        setAudits(prev => [newlyAdded, ...prev]);
        showToast(`Laporan hasil audit untuk wilayah ${formWilayah} berhasil disimpan secara real-time!`, "success");
        resetForm();
      } else {
        showToast("Gagal menyimpan ke server. Menyimpan secara lokal...", "info");
        const updated = [localPayload, ...audits];
        setAudits(updated);
        localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
        setIsStandalone(true);
        localStorage.setItem("siams_standalone_mode", "true");
        resetForm();
      }
    } catch (err) {
      showToast("Gagal berkomunikasi dengan server. Menyimpan secara lokal...", "info");
      const updated = [localPayload, ...audits];
      setAudits(updated);
      localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
      setIsStandalone(true);
      localStorage.setItem("siams_standalone_mode", "true");
      resetForm();
    }
  };

  // Action: Save updated sanction item via PUT API
  const handleSaveSanctionUpdate = async () => {
    if (!selectedSanction || !editSanctionForm) return;

    if (
      !editSanctionForm.auditor ||
      !editSanctionForm.periodeAwal ||
      !editSanctionForm.periodeAkhir ||
      !editSanctionForm.region ||
      !editSanctionForm.wilayah ||
      !editSanctionForm.namaPic ||
      !editSanctionForm.jenisTemuan ||
      !editSanctionForm.rekomendasiSanksi
    ) {
      showToast("Mohon lengkapi seluruh kolom wajib bertanda bintang (*).", "error");
      return;
    }

    const localForm = {
      ...editSanctionForm,
      periodeAwal: formatDateToDMY(editSanctionForm.periodeAwal),
      periodeAkhir: formatDateToDMY(editSanctionForm.periodeAkhir)
    };

    try {
      setUpdatingSanction(true);
      if (isStandalone) {
        const updated = sanctions.map(s => s.id === localForm.id ? localForm : s);
        setSanctions(updated);
        localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
        showToast(`Rekomendasi sanksi untuk PIC ${localForm.namaPic} berhasil diperbarui secara lokal!`, "success");
        setSelectedSanction(null);
        return;
      }

      const res = await fetch(`/api/sanctions/${selectedSanction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSanctionForm)
      });
      
      if (res.ok) {
        const updatedItem = await res.json();
        setSanctions(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
        showToast(`Rekomendasi sanksi untuk PIC ${updatedItem.namaPic} berhasil diperbarui secara real-time!`, "success");
        setSelectedSanction(null);
      } else {
        showToast("Gagal memperbarui di server. Memperbarui secara lokal...", "info");
        const updated = sanctions.map(s => s.id === localForm.id ? localForm : s);
        setSanctions(updated);
        localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
        setIsStandalone(true);
        localStorage.setItem("siams_standalone_mode", "true");
        setSelectedSanction(null);
      }
    } catch (err) {
      showToast("Gagal berkomunikasi dengan server. Memperbarui secara lokal...", "info");
      const updated = sanctions.map(s => s.id === localForm.id ? localForm : s);
      setSanctions(updated);
      localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
      setIsStandalone(true);
      localStorage.setItem("siams_standalone_mode", "true");
      setSelectedSanction(null);
    } finally {
      setUpdatingSanction(false);
    }
  };

  // Action: Export filtered sanction data to Excel format
  const handleExportSanctionExcel = () => {
    if (filteredSanctions.length === 0) {
      showToast("Tidak ada data sanksi untuk diexport.", "error");
      return;
    }
    
    try {
      // Map data to Indonesian columns with clean fallback formatting
      const exportData = filteredSanctions.map((item, idx) => ({
        "No": idx + 1,
        "Auditor": item.auditor || "-",
        "Periode Awal": formatDateToDMY(item.periodeAwal),
        "Periode Akhir": formatDateToDMY(item.periodeAkhir),
        "Region": item.region || "-",
        "Wilayah": item.wilayah || "-",
        "Nama PIC": item.namaPic || "-",
        "Jenis Temuan": item.jenisTemuan || "-",
        "Rekomendasi Sanksi": item.rekomendasiSanksi || "-",
        "Implementasi Sanksi": item.implementasiSanksi || "-",
        "Catatan Tambahan": item.catatanTambahan || "-",
        "Status Sanksi": item.statusSanksi || "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekomendasi Sanksi");
      
      // Auto-fit column widths elegantly
      const maxLens = Object.keys(exportData[0]).map(key => {
        let maxVal = key.length;
        exportData.forEach(row => {
          const val = String((row as any)[key] || "");
          if (val.length > maxVal) {
            maxVal = val.length;
          }
        });
        return { wch: Math.min(Math.max(maxVal + 2, 8), 50) };
      });
      worksheet["!cols"] = maxLens;

      // Write and save file with dynamic timestamp
      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Laporan_Rekomendasi_Sanksi_${today}.xlsx`);
      showToast("Laporan rekomendasi sanksi berhasil diexport ke format Excel (.xlsx)!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengexport file Excel.", "error");
    }
  };

  // Action: Submit manual sanction form via POST API
  const handleManualSanctionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formSanctionAuditor ||
      !formSanctionPeriodeAwal ||
      !formSanctionPeriodeAkhir ||
      !formSanctionRegion ||
      !formSanctionWilayah ||
      !formSanctionNamaPic ||
      !formSanctionJenisTemuan ||
      !formSanctionRekomendasiSanksi
    ) {
      showToast("Mohon lengkapi seluruh kolom wajib bertanda bintang (*).", "error");
      return;
    }

    const payload = {
      auditor: formSanctionAuditor,
      periodeAwal: formSanctionPeriodeAwal,
      periodeAkhir: formSanctionPeriodeAkhir,
      region: formSanctionRegion,
      wilayah: formSanctionWilayah,
      namaPic: formSanctionNamaPic,
      jenisTemuan: formSanctionJenisTemuan,
      rekomendasiSanksi: formSanctionRekomendasiSanksi,
      implementasiSanksi: formSanctionImplementasiSanksi || "-",
      catatanTambahan: formSanctionCatatanTambahan || "-",
      statusSanksi: formSanctionStatusSanksi
    };

    const localPayload = {
      ...payload,
      id: Date.now(),
      periodeAwal: formatDateToDMY(formSanctionPeriodeAwal),
      periodeAkhir: formatDateToDMY(formSanctionPeriodeAkhir)
    };

    const resetForm = () => {
      setFormSanctionAuditor("");
      setFormSanctionPeriodeAwal("");
      setFormSanctionPeriodeAkhir("");
      setFormSanctionRegion("");
      setFormSanctionWilayah("");
      setFormSanctionNamaPic("");
      setFormSanctionJenisTemuan("");
      setFormSanctionRekomendasiSanksi("");
      setFormSanctionImplementasiSanksi("");
      setFormSanctionCatatanTambahan("");
      setFormSanctionStatusSanksi("Active");
      setActiveTab("sanksi");
    };

    if (isStandalone) {
      const updated = [localPayload, ...sanctions];
      setSanctions(updated);
      localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
      showToast(`Rekomendasi sanksi untuk PIC ${formSanctionNamaPic} berhasil disimpan secara lokal!`, "success");
      resetForm();
      return;
    }

    try {
      const res = await fetch("/api/sanctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newlyAdded = await res.json();
        setSanctions(prev => [newlyAdded, ...prev]);
        showToast(`Rekomendasi sanksi untuk PIC ${formSanctionNamaPic} berhasil disimpan secara real-time!`, "success");
        resetForm();
      } else {
        showToast("Gagal menyimpan ke server. Menyimpan secara lokal...", "info");
        const updated = [localPayload, ...sanctions];
        setSanctions(updated);
        localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
        setIsStandalone(true);
        localStorage.setItem("siams_standalone_mode", "true");
        resetForm();
      }
    } catch (err) {
      showToast("Gagal berkomunikasi dengan server. Menyimpan secara lokal...", "info");
      const updated = [localPayload, ...sanctions];
      setSanctions(updated);
      localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
      setIsStandalone(true);
      localStorage.setItem("siams_standalone_mode", "true");
      resetForm();
    }
  };

  // Action: Handle file parsing from client-side spreadsheet upload for sanctions
  const processSanctionExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rawJson.length === 0) {
          showToast("File Excel kosong atau tidak terstruktur dengan benar.", "error");
          return;
        }

        // Map column headers safely for sanctions
        const mappedItems = rawJson.map((row) => {
          const findVal = (keys: string[]) => {
            const matchKey = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()));
            return matchKey ? String(row[matchKey]).trim() : "";
          };

          return {
            auditor: findVal(["auditor", "nama auditor", "pemeriksa"]) || "Tim Auditor Internal SIP",
            periodeAwal: findVal(["periode awal", "periode_awal", "tanggal mulai", "start date"]) || "2026-01-01",
            periodeAkhir: findVal(["periode akhir", "periode_akhir", "tanggal selesai", "end date"]) || "2026-06-30",
            region: findVal(["region", "regional", "region wilayah"]),
            wilayah: findVal(["wilayah", "lokasi", "cabang", "wilayah cakupan"]),
            namaPic: findVal(["nama pic", "pic", "nama_pic", "person in charge", "nama"]),
            jenisTemuan: findVal(["jenis temuan", "jenis_temuan", "kategori temuan", "temuan", "jenis"]),
            rekomendasiSanksi: findVal(["rekomendasi sanksi", "rekomendasi_sanksi", "sanksi", "rekomendasi"]),
            implementasiSanksi: findVal(["implementasi sanksi", "implementasi_sanksi", "implementasi", "realisasi sanksi"]) || "-",
            catatanTambahan: findVal(["catatan tambahan", "catatan_tambahan", "catatan", "keterangan"]) || "-",
            statusSanksi: (() => {
              const rawVal = findVal(["status sanksi", "status_sanksi", "status"]);
              const norm = rawVal.trim().toLowerCase();
              if (norm === "selesai" || norm === "terminated") return "Terminated";
              if (norm === "on progress" || norm === "active") return "Active";
              if (norm === "void" || norm === "inactive") return "Inactive";
              return "Active";
            })()
          };
        });

        // Filter out completely empty rows
        const validItems = mappedItems.filter(item => item.region && item.wilayah && item.namaPic);

        if (validItems.length === 0) {
          showToast("Tidak ada baris data sanksi valid yang terdeteksi. Periksa kesesuaian header kolom.", "error");
          return;
        }

        const localBulkItems = validItems.map((item, idx) => ({
          ...item,
          id: Date.now() + idx,
          periodeAwal: formatDateToDMY(item.periodeAwal),
          periodeAkhir: formatDateToDMY(item.periodeAkhir)
        }));

        if (isStandalone) {
          const updated = [...localBulkItems, ...sanctions];
          setSanctions(updated);
          localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
          showToast(`Berhasil! (Mode Lokal) Sistem mendeteksi dan menginput sebanyak ${localBulkItems.length} data rekomendasi sanksi dari Excel.`, "success");
          setActiveTab("sanksi");
          return;
        }

        try {
          const response = await fetch("/api/sanctions/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validItems)
          });

          if (response.ok) {
            const result = await response.json();
            fetchSanctions();
            showToast(`Berhasil! Sistem mendeteksi dan menginput sebanyak ${result.count} data rekomendasi sanksi dari Excel.`, "success");
            setActiveTab("sanksi");
          } else {
            showToast("Gagal mengunggah ke server database. Menginput secara lokal...", "info");
            const updated = [...localBulkItems, ...sanctions];
            setSanctions(updated);
            localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
            setIsStandalone(true);
            localStorage.setItem("siams_standalone_mode", "true");
            setActiveTab("sanksi");
          }
        } catch (err) {
          showToast("Gagal berkomunikasi dengan server. Menginput secara lokal...", "info");
          const updated = [...localBulkItems, ...sanctions];
          setSanctions(updated);
          localStorage.setItem("siams_standalone_sanctions", JSON.stringify(updated));
          setIsStandalone(true);
          localStorage.setItem("siams_standalone_mode", "true");
          setActiveTab("sanksi");
        }
      } catch (err) {
        showToast("Kesalahan saat mengurai file Excel. Pastikan format spreadsheet valid.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSanctionExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSanctionExcelFile(file);
  };

  // Action: Handle file parsing from client-side spreadsheet upload
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rawJson.length === 0) {
          showToast("File Excel kosong atau tidak terstruktur dengan benar.", "error");
          return;
        }

        // Map column headers safely (supporting standard user names case-insensitively)
        const mappedItems = rawJson.map((row) => {
          const findVal = (keys: string[]) => {
            const matchKey = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()));
            return matchKey ? String(row[matchKey]).trim() : "";
          };

          return {
            auditor: findVal(["auditor", "nama auditor", "pemeriksa"]) || "Tim Auditor Internal SIP",
            periodeAwal: findVal(["periode awal", "periode_awal", "tanggal mulai", "start date"]) || "2026-01-01",
            periodeAkhir: findVal(["periode akhir", "periode_akhir", "tanggal selesai", "end date"]) || "2026-06-30",
            region: findVal(["region", "regional", "region wilayah"]),
            wilayah: findVal(["wilayah", "lokasi", "cabang", "wilayah cakupan"]),
            jenis: findVal(["jenis", "jenis audit", "kategori"]),
            temuan: findVal(["temuan", "temuan audit", "temuan hasil kerja"]),
            kondisi: findVal(["kondisi", "kondisi permasalahan", "kondisi masalah", "permasalahan"]) || "-",
            penyebab: findVal(["penyebab", "penyebab utama", "akar penyebab"]),
            risiko: findVal(["risiko", "risiko teridentifikasi", "tingkat risiko"]),
            rekomendasi: findVal(["rekomendasi", "rekomendasi & action plan", "rekomendasi perbaikan"]),
            plan: findVal(["action plan", "plan", "rencana tindak lanjut"]),
            sop: findVal([
              "sop/sk/iom acuan", 
              "sop / sk / iom acuan", 
              "sop/sk/iom", 
              "sop/sk/iom_acuan",
              "sk/sop/iom acuan", 
              "sk/sop/iom", 
              "sop acuan", 
              "sop_acuan",
              "sop", 
              "acuan", 
              "acuan sop", 
              "acuan sk", 
              "acuan iom"
            ]) || "-",
            sk: findVal(["sk acuan", "sk", "nomor sk", "no sk", "sk_acuan"]) || "-",
            status: (findVal(["status", "status audit"]) as any) || "On Progress"
          };
        });

        // Filter out completely empty rows
        const validItems = mappedItems.filter(item => item.region && item.wilayah && item.temuan);

        if (validItems.length === 0) {
          showToast("Tidak ada baris data valid yang terdeteksi. Periksa kesesuaian header kolom.", "error");
          return;
        }

        const localBulkItems = validItems.map((item, idx) => ({
          ...item,
          id: Date.now() + idx,
          periodeAwal: formatDateToDMY(item.periodeAwal),
          periodeAkhir: formatDateToDMY(item.periodeAkhir)
        }));

        if (isStandalone) {
          const updated = [...localBulkItems, ...audits];
          setAudits(updated);
          localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
          showToast(`Berhasil! (Mode Lokal) Sistem mendeteksi dan menginput sebanyak ${localBulkItems.length} data laporan audit dari Excel.`, "success");
          setActiveTab("monitoring");
          return;
        }

        try {
          // Post to Bulk API endpoint
          const response = await fetch("/api/audits/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validItems)
          });

          if (response.ok) {
            const result = await response.json();
            fetchAudits(); // reload the entire updated list
            showToast(`Berhasil! Sistem mendeteksi dan menginput sebanyak ${result.count} data laporan audit dari Excel.`, "success");
            setActiveTab("monitoring");
          } else {
            showToast("Gagal mengunggah ke server database. Menginput secara lokal...", "info");
            const updated = [...localBulkItems, ...audits];
            setAudits(updated);
            localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
            setIsStandalone(true);
            localStorage.setItem("siams_standalone_mode", "true");
            setActiveTab("monitoring");
          }
        } catch (err) {
          showToast("Gagal berkomunikasi dengan server. Menginput secara lokal...", "info");
          const updated = [...localBulkItems, ...audits];
          setAudits(updated);
          localStorage.setItem("siams_standalone_audits", JSON.stringify(updated));
          setIsStandalone(true);
          localStorage.setItem("siams_standalone_mode", "true");
          setActiveTab("monitoring");
        }
      } catch (err) {
        showToast("Kesalahan saat mengurai file Excel. Pastikan format spreadsheet valid.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processExcelFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setExcelDragOver(true);
  };

  const handleDragLeave = () => {
    setExcelDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setExcelDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  if (!userRole) {
    return (
      <div className="bg-[#0B1528] font-sans text-slate-100 antialiased min-h-screen flex flex-col justify-between" style={{ backgroundImage: "radial-gradient(circle at top right, #1E2E4A 0%, #0B1528 70%)" }}>
        
        {/* Toast Notification Container */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4"
            >
              <div className={`p-4 rounded-xl shadow-lg border flex items-start space-x-3 backdrop-blur-md ${
                toast.type === "success" 
                  ? "bg-emerald-500/95 border-emerald-400 text-white" 
                  : toast.type === "error"
                  ? "bg-rose-500/95 border-rose-400 text-white"
                  : "bg-indigo-600/95 border-indigo-500 text-white"
              }`}>
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : toast.type === "error" ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-grow">
                  <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
                </div>
                <button onClick={() => setToast(null)} className="text-white/80 hover:text-white cursor-pointer transition-colors">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            
            {/* Header logo & title */}
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-[#14233C] rounded-3xl border border-[#233A5E] shadow-2xl mb-4 transform transition-transform hover:rotate-3 duration-300">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="drop-grad-login-1" x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#1E40AF" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="drop-grad-login-2" x1="30" y1="90" x2="70" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0284C7" />
                      <stop offset="100%" stopColor="#0EA5E9" />
                    </linearGradient>
                    <linearGradient id="drop-grad-login-3" x1="40" y1="95" x2="60" y2="40" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0EA5E9" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <path d="M50 90C28 90 15 70 20 45C22 35 28 25 35 15C36 13 38 14 38 16C35 25 36 35 42 43C48 51 58 53 62 45C65 38 62 28 55 20C54 19 55 17 56 18C68 28 75 42 75 58C75 75 64 90 50 90Z" fill="url(#drop-grad-login-1)" />
                  <path d="M50 85C34 85 24 72 28 52C30 44 35 36 41 28C42 26 43 27 43 29C40 36 41 44 46 51C51 58 59 59 62 53C65 47 62 39 57 32C56 31 57 29 58 30C66 38 71 49 71 61C71 74 62 85 50 85Z" fill="url(#drop-grad-login-2)" opacity="0.9" />
                  <path d="M50 80C40 80 34 71 36 58C37 52 41 46 45 40C46 38 47 39 47 41C45 46 46 52 50 57C54 62 60 62 62 57C64 52 62 46 58 41C57 40 58 38 59 39C64 45 67 53 67 62C67 72 59 80 50 80Z" fill="url(#drop-grad-login-3)" />
                </svg>
              </div>
              
              <div className="flex justify-center items-center space-x-1.5 mb-1">
                <span className="font-display font-light text-slate-400 text-xs tracking-[0.25em] uppercase">PT. Solusi</span>
                <span className="font-display font-bold text-sky-400 text-xs tracking-wider uppercase">Integrasi Pratama</span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-wider font-display uppercase">Audit Portal</h1>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">Sistem Manajemen Audit Internal Kepatuhan Operasional Regional. Data pada portal ini bersifat rahasia dan diaudit secara berkala.</p>
            </div>

            {/* Login Card */}
            <div className="bg-[#101F37]/80 backdrop-blur-md rounded-2xl border border-[#1E3A65] p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center space-x-3 pb-4 border-b border-[#1E3A65]">
                <Lock className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Authentication Required</h2>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start space-x-2.5 animate-pulse">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">ID Pengguna</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Masukkan ID Pengguna"
                      className="w-full bg-[#081121] border border-[#1E3A65] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all placeholder:text-slate-600 font-mono"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Kata Sandi (Password)</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#081121] border border-[#1E3A65] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all placeholder:text-slate-600 font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-sky-500/10 flex items-center justify-center space-x-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Masuk ke Portal</span>
                </button>
              </form>

              {/* Secure Credentials Note */}
              <div className="p-3.5 bg-sky-950/40 border border-sky-900/30 text-[11px] text-sky-300/90 rounded-xl space-y-1.5 font-mono">
                <div className="flex items-center space-x-2 font-bold uppercase text-sky-400 text-[10px]">
                  <Info className="w-3.5 h-3.5" />
                  <span>Petunjuk Login Audit</span>
                </div>
                <p className="leading-relaxed">Silakan gunakan akun resmi yang terdaftar untuk mengakses portal sesuai dengan hak wewenang akses Anda.</p>
              </div>

            </div>

          </div>
        </div>

        {/* Login Footer */}
        <footer className="text-center py-6 text-[10px] text-slate-600 border-t border-[#14233C] font-mono">
          PT. Solusi Integrasi Pratama &copy; 2026. Seluruh hak cipta dilindungi undang-undang.
        </footer>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] font-sans text-slate-800 antialiased min-h-screen flex flex-col">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4"
          >
            <div className={`p-4 rounded-xl shadow-lg border flex items-start space-x-3 backdrop-blur-md ${
              toast.type === "success" 
                ? "bg-emerald-500/95 border-emerald-400 text-white" 
                : toast.type === "error"
                ? "bg-rose-500/95 border-rose-400 text-white"
                : "bg-indigo-600/95 border-indigo-500 text-white"
            }`}>
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-grow">
                <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-white/80 hover:text-white cursor-pointer transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SYSTEM */}
      <header className="bg-[#0B1528] text-white shadow-xl border-b border-[#1E2E4A] sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            
            {/* STYLIZED CORPORATE LOGO SVG */}
            <div className="p-2 bg-[#14233C] rounded-2xl border border-[#233A5E] flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 duration-300">
              <svg className="w-12 h-12 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="drop-grad-1" x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1E40AF" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                  <linearGradient id="drop-grad-2" x1="30" y1="90" x2="70" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0284C7" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                  <linearGradient id="drop-grad-3" x1="40" y1="95" x2="60" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0EA5E9" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
                {/* Outer droplet petal */}
                <path d="M50 90C28 90 15 70 20 45C22 35 28 25 35 15C36 13 38 14 38 16C35 25 36 35 42 43C48 51 58 53 62 45C65 38 62 28 55 20C54 19 55 17 56 18C68 28 75 42 75 58C75 75 64 90 50 90Z" fill="url(#drop-grad-1)" />
                {/* Middle layered flame */}
                <path d="M50 85C34 85 24 72 28 52C30 44 35 36 41 28C42 26 43 27 43 29C40 36 41 44 46 51C51 58 59 59 62 53C65 47 62 39 57 32C56 31 57 29 58 30C66 38 71 49 71 61C71 74 62 85 50 85Z" fill="url(#drop-grad-2)" opacity="0.9" />
                {/* Central shining drop core */}
                <path d="M50 80C40 80 34 71 36 58C37 52 41 46 45 40C46 38 47 39 47 41C45 46 46 52 50 57C54 62 60 62 62 57C64 52 62 46 58 41C57 40 58 38 59 39C64 45 67 53 67 62C67 72 59 80 50 80Z" fill="url(#drop-grad-3)" />
              </svg>
            </div>

            <div className="flex flex-col select-none">
              <div className="flex items-baseline space-x-1.5">
                <span className="font-display font-light text-slate-300 text-xs tracking-[0.25em] uppercase">PT. Solusi</span>
                <span className="font-display font-bold text-sky-400 text-xs tracking-wider uppercase">Integrasi Pratama</span>
              </div>
              <h1 className="text-sm font-bold tracking-wider text-white mt-0.5 uppercase font-display">Internal Corporate Audit System</h1>
              <p className="text-[10px] text-slate-400 font-medium">Sistem Informasi Monitoring & Manajemen Hasil Audit Kepatuhan Operasional Nasional</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Standalone/Offline Mode Badge */}
            {isStandalone && (
              <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-lg">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-[10px] font-bold text-amber-300 uppercase font-mono tracking-wider">
                  Mode Standalone (Lokal)
                </span>
              </div>
            )}

            {/* User Role Badge */}
            <div className="flex items-center space-x-2 bg-[#14233C] border border-[#233A5E] px-3.5 py-2 rounded-2xl shadow-lg">
              <div className={`w-2 h-2 rounded-full ${userRole === "admin" ? "bg-emerald-400 animate-pulse" : "bg-sky-400"}`}></div>
              <span className="text-[10px] font-bold text-slate-200 uppercase font-mono tracking-wider">
                {userRole === "admin" ? "Super Admin" : "Viewer"}
              </span>
            </div>

            <div className="bg-[#14233C] border border-[#233A5E] px-4 py-2 rounded-2xl text-slate-300 flex items-center shadow-lg text-xs font-semibold font-mono hidden md:flex">
              <Calendar className="w-4 h-4 mr-2 text-sky-400" />
              <span>Sistem Aktif</span>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="p-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/30 text-rose-300 rounded-xl cursor-pointer shadow-lg transition-colors flex items-center text-xs font-bold font-mono group"
              title="Keluar dari Portal"
            >
              <LogOut className="w-4 h-4 md:mr-1.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOP NAVIGATION SYSTEM */}
      <div className="bg-[#101F37] border-b border-[#1E2E4A] sticky top-[81px] z-30 shadow-md backdrop-blur-md bg-opacity-95">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap gap-3 items-center">
          <button 
            id="tab-monitoring-btn"
            onClick={() => {
              setActiveTab("monitoring");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === "monitoring"
                ? "bg-sky-500 text-slate-900 border-sky-400 font-bold shadow-lg shadow-sky-500/20"
                : "bg-[#1E293B] text-slate-300 border-[#334155] hover:text-white hover:bg-[#334155]"
            }`}
          >
            <FolderCheck className="w-4 h-4 text-slate-900" style={{ color: activeTab === "monitoring" ? "#0F172A" : "#38BDF8" }} />
            <span>Dashboard Monitoring Audit</span>
          </button>
          
          {userRole === "admin" && (
            <button 
              id="tab-input-btn"
              onClick={() => {
                setActiveTab("input");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === "input"
                  ? "bg-sky-500 text-slate-900 border-sky-400 font-bold shadow-lg shadow-sky-500/20"
                  : "bg-[#1E293B] text-slate-300 border-[#334155] hover:text-white hover:bg-[#334155]"
              }`}
            >
              <Plus className="w-4 h-4 text-slate-900" style={{ color: activeTab === "input" ? "#0F172A" : "#38BDF8" }} />
              <span>Portal Input Hasil Audit</span>
            </button>
          )}

          <button 
            id="tab-sanksi-btn"
            onClick={() => {
              setActiveTab("sanksi");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === "sanksi"
                ? "bg-amber-600 text-white border-amber-500 font-bold shadow-lg shadow-amber-500/20"
                : "bg-[#1E293B] text-slate-300 border-[#334155] hover:text-white hover:bg-[#334155]"
            }`}
          >
            <ShieldAlert className="w-4 h-4" style={{ color: activeTab === "sanksi" ? "#FFFFFF" : "#F59E0B" }} />
            <span>Dashboard Rekomendasi Sanksi</span>
          </button>
          
          {userRole === "admin" && (
            <button 
              id="tab-input-sanksi-btn"
              onClick={() => {
                setActiveTab("input_sanksi");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === "input_sanksi"
                  ? "bg-amber-600 text-white border-amber-500 font-bold shadow-lg shadow-amber-500/20"
                  : "bg-[#1E293B] text-slate-300 border-[#334155] hover:text-white hover:bg-[#334155]"
              }`}
            >
              <Plus className="w-4 h-4" style={{ color: activeTab === "input_sanksi" ? "#FFFFFF" : "#F59E0B" }} />
              <span>Portal Input Rekomendasi Sanksi</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN DASHBOARD WRAPPER */}
      <main className="max-w-[1600px] w-full mx-auto px-6 py-8 flex-grow">

        {/* TAB 1: DASHBOARD MONITORING */}
        {activeTab === "monitoring" && (
          <div className="space-y-6">
            
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-sky-500 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Total Kasus Temuan</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1.5 font-display tracking-tight">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-sky-500" /> : totalFindingsCount}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Seluruh wilayah operasional</span>
                </div>
                <div className="w-12 h-12 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center text-sky-600 shadow-inner">
                  <FolderCheck className="w-6 h-6 text-sky-500" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-emerald-500 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600/95 uppercase tracking-wider font-display">Status: Selesai</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1.5 font-display tracking-tight">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-400" /> : selesaiCount}
                  </p>
                  <span className="text-[10px] text-emerald-600/70 font-medium block mt-1">Selesai ditindaklanjuti</span>
                </div>
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-amber-500 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-amber-600/95 uppercase tracking-wider font-display">Status: On Progress</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-1.5 font-display tracking-tight">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : progressCount}
                  </p>
                  <span className="text-[10px] text-amber-600/70 font-medium block mt-1">Dalam proses eksekusi</span>
                </div>
                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-rose-500 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-rose-600/95 uppercase tracking-wider font-display">Status: Void</p>
                  <p className="text-3xl font-extrabold text-rose-600 mt-1.5 font-display tracking-tight">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-rose-400" /> : voidCount}
                  </p>
                  <span className="text-[10px] text-rose-600/70 font-medium block mt-1">Kasus dibatalkan/ditutup</span>
                </div>
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* FILTER CONTROLS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-5">
                <div className="p-1.5 bg-sky-50 rounded-lg border border-sky-100">
                  <SlidersHorizontal className="w-4 h-4 text-sky-500" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Panel Filter Wilayah & Status</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                
                {/* Region Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Pilih Region Wilayah</label>
                  <select 
                    id="filter-region"
                    value={filterRegion} 
                    onChange={(e) => handleRegionFilterChange(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-700 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                  >
                    <option value="ALL">Semua Region Wilayah</option>
                    {Object.keys(regionMapping).map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                {/* Wilayah (Lokasi) Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Pilih Lokasi (Warehouse/Area)</label>
                  <select 
                    id="filter-wilayah"
                    value={filterWilayah} 
                    onChange={(e) => setFilterWilayah(e.target.value)}
                    disabled={filterRegion === "ALL"}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-700 cursor-pointer shadow-xs disabled:opacity-50 transition-all hover:bg-slate-50"
                  >
                    <option value="ALL">Semua Cakupan Wilayah</option>
                    {filterRegion !== "ALL" && regionMapping[filterRegion]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Pilih Status Audit</label>
                  <select 
                    id="filter-status"
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-700 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                  >
                    <option value="ALL">Semua Status Audit</option>
                    <option value="Selesai">Selesai</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Void">Void</option>
                  </select>
                </div>

                {/* Text Search Query */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Cari Kata Kunci</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari temuan, SOP, SK, dsb..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-700 shadow-xs transition-all placeholder:text-slate-400"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

              </div>
            </div>

              /* MAIN DATA GRID TABLE */
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col shadow-sm">
              <div className="px-6 py-5 bg-[#F8FAFC] border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">Lembar Monitoring Hasil Audit Komprehensif</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Gunakan tombol <strong className="text-slate-800">Kelola</strong> di sisi kanan untuk memperbarui status temuan secara real-time.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-sky-50 text-sky-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-sky-100 flex items-center font-mono shadow-xs">
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-sky-500" /> Terfilter: <span className="mx-1 font-bold text-sky-800">{filteredAudits.length}</span> data
                  </div>
                  <button
                    onClick={resetColumnWidths}
                    className="bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center font-mono shadow-xs cursor-pointer transition-all gap-1.5"
                    title="Kembalikan ukuran kolom ke pengaturan bawaan"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Reset Kolom</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center font-mono shadow-md cursor-pointer transition-all gap-1.5"
                    title="Export hasil laporan audit ke format Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-100 flex-shrink-0" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Responsive Table with Dynamic Column Resizing */}
              <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200">
                <table 
                  style={{ 
                    width: (Object.values(colWidths) as number[]).reduce((sum, w) => sum + w, 0),
                    tableLayout: "fixed"
                  }}
                  className="text-left border-collapse"
                >
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 select-none">
                      
                      {/* Auditor */}
                      <th 
                        style={{ width: colWidths.auditor, minWidth: colWidths.auditor, maxWidth: colWidths.auditor }}
                        className="py-3.5 px-5 relative group border-r border-slate-200/50"
                      >
                        <div className="truncate" title="Auditor">Auditor</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "auditor")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "auditor" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Periode Awal */}
                      <th 
                        style={{ width: colWidths.periodeAwal, minWidth: colWidths.periodeAwal, maxWidth: colWidths.periodeAwal }}
                        className="py-3.5 px-4 relative group border-r border-slate-200/50"
                      >
                        <div 
                          onClick={() => handleSort("periodeAwal")}
                          className="flex items-center space-x-1 cursor-pointer hover:text-sky-600 transition-colors select-none"
                          title="Klik untuk mengurutkan Periode Awal"
                        >
                          <span className="truncate">Periode Awal</span>
                          {sortColumn === "periodeAwal" ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-500 flex-shrink-0" />
                          )}
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "periodeAwal")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "periodeAwal" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Periode Akhir */}
                      <th 
                        style={{ width: colWidths.periodeAkhir, minWidth: colWidths.periodeAkhir, maxWidth: colWidths.periodeAkhir }}
                        className="py-3.5 px-4 relative group border-r border-slate-200/50"
                      >
                        <div 
                          onClick={() => handleSort("periodeAkhir")}
                          className="flex items-center space-x-1 cursor-pointer hover:text-sky-600 transition-colors select-none"
                          title="Klik untuk mengurutkan Periode Akhir"
                        >
                          <span className="truncate">Periode Akhir</span>
                          {sortColumn === "periodeAkhir" ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-500 flex-shrink-0" />
                          )}
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "periodeAkhir")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "periodeAkhir" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Region & Wilayah */}
                      <th 
                        style={{ width: colWidths.region, minWidth: colWidths.region, maxWidth: colWidths.region }}
                        className="py-3.5 px-5 relative group border-r border-slate-200/50"
                      >
                        <div className="truncate" title="Region & Wilayah">Region & Wilayah</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "region")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "region" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Jenis Audit */}
                      <th 
                        style={{ width: colWidths.jenis, minWidth: colWidths.jenis, maxWidth: colWidths.jenis }}
                        className="py-3.5 px-4 relative group border-r border-slate-200/50"
                      >
                        <div className="truncate" title="Jenis Audit">Jenis Audit</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "jenis")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "jenis" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Temuan Audit */}
                      <th 
                        style={{ width: colWidths.temuan, minWidth: colWidths.temuan, maxWidth: colWidths.temuan }}
                        className="py-3.5 px-5 relative group border-r border-slate-200/50"
                      >
                        <div className="truncate" title="Temuan Audit">Temuan Audit</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "temuan")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "temuan" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Kondisi Permasalahan */}
                      <th 
                        style={{ width: colWidths.kondisi, minWidth: colWidths.kondisi, maxWidth: colWidths.kondisi }}
                        className="py-3.5 px-5 relative group border-r border-sky-200/60 bg-sky-50/40 text-sky-900"
                      >
                        <div className="truncate font-extrabold" title="Kondisi Permasalahan (Kronologi)">Kondisi Permasalahan ↔</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "kondisi")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "kondisi" ? "bg-sky-500 opacity-100" : "group-hover:bg-sky-200"}`}
                        />
                      </th>

                      {/* Penyebab Utama */}
                      <th 
                        style={{ width: colWidths.penyebab, minWidth: colWidths.penyebab, maxWidth: colWidths.penyebab }}
                        className="py-3.5 px-5 relative group border-r border-sky-200/60 bg-sky-50/40 text-sky-900"
                      >
                        <div className="truncate font-extrabold" title="Penyebab Utama">Penyebab Utama ↔</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "penyebab")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "penyebab" ? "bg-sky-500 opacity-100" : "group-hover:bg-sky-200"}`}
                        />
                      </th>

                      {/* Risiko */}
                      <th 
                        style={{ width: colWidths.risiko, minWidth: colWidths.risiko, maxWidth: colWidths.risiko }}
                        className="py-3.5 px-4 relative group border-r border-slate-200/50 text-center"
                      >
                        <div className="truncate" title="Risiko">Risiko</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "risiko")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "risiko" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Rekomendasi */}
                      <th 
                        style={{ width: colWidths.rekomendasi, minWidth: colWidths.rekomendasi, maxWidth: colWidths.rekomendasi }}
                        className="py-3.5 px-5 relative group border-r border-slate-200/50"
                      >
                        <div className="truncate" title="Rekomendasi">Rekomendasi</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "rekomendasi")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "rekomendasi" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* Action Plan */}
                      <th 
                        style={{ width: colWidths.plan, minWidth: colWidths.plan, maxWidth: colWidths.plan }}
                        className="py-3.5 px-5 relative group border-r border-slate-200/50"
                      >
                        <div className="truncate" title="Action Plan">Action Plan</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "plan")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "plan" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                      {/* SOP/SK/IOM Acuan */}
                      <th 
                        style={{ width: colWidths.sop, minWidth: colWidths.sop, maxWidth: colWidths.sop }}
                        className="py-3.5 px-4 relative group border-r border-sky-200/60 bg-sky-50/40 text-sky-900"
                      >
                        <div className="truncate font-extrabold" title="SOP/SK/IOM Acuan">SOP/SK/IOM Acuan ↔</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "sop")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "sop" ? "bg-sky-500 opacity-100" : "group-hover:bg-sky-200"}`}
                        />
                      </th>

                      {/* Status & Aksi */}
                      <th 
                        style={{ width: colWidths.status, minWidth: colWidths.status, maxWidth: colWidths.status }}
                        className="py-3.5 px-5 relative group text-center"
                      >
                        <div className="truncate" title="Status & Aksi">Status & Aksi</div>
                        <div 
                          onMouseDown={(e) => handleResizeMouseDown(e, "status")}
                          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-all z-10 hover:bg-sky-500 active:bg-sky-600 ${resizingCol === "status" ? "bg-sky-500" : "group-hover:bg-slate-300"}`}
                        />
                      </th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={13} className="py-16 text-center text-slate-400 font-medium">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
                          <span className="font-mono text-xs">Mendapatkan data real-time dari server...</span>
                        </td>
                      </tr>
                    ) : filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-16 text-center text-slate-400 font-medium font-mono text-xs">
                          Tidak ada data audit yang memenuhi kriteria filter saat ini.
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 last:border-0">
                          
                          <td 
                            style={{ width: colWidths.auditor, minWidth: colWidths.auditor, maxWidth: colWidths.auditor }}
                            className="py-4 px-5 text-slate-800 font-semibold font-mono text-[11px] border-r border-slate-100/80"
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate" title={item.auditor || "-"}>{item.auditor || "-"}</span>
                            </div>
                          </td>

                          <td 
                            style={{ width: colWidths.periodeAwal, minWidth: colWidths.periodeAwal, maxWidth: colWidths.periodeAwal }}
                            className="py-4 px-4 font-mono text-[11px] text-slate-500 border-r border-slate-100/80"
                          >
                            <div className="flex items-center space-x-1 truncate">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{formatDateToDMY(item.periodeAwal)}</span>
                            </div>
                          </td>

                          <td 
                            style={{ width: colWidths.periodeAkhir, minWidth: colWidths.periodeAkhir, maxWidth: colWidths.periodeAkhir }}
                            className="py-4 px-4 font-mono text-[11px] text-slate-500 border-r border-slate-100/80"
                          >
                            <div className="flex items-center space-x-1 truncate">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{formatDateToDMY(item.periodeAkhir)}</span>
                            </div>
                          </td>

                          <td 
                            style={{ width: colWidths.region, minWidth: colWidths.region, maxWidth: colWidths.region }}
                            className="py-4 px-5 border-r border-slate-100/80"
                          >
                            <span className="font-bold text-slate-900 block font-display text-sm truncate" title={item.region}>{item.region}</span>
                            <span className="text-[10px] text-slate-400 flex items-center mt-1 font-mono truncate" title={item.wilayah}>
                              <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500 flex-shrink-0" /> {item.wilayah}
                            </span>
                          </td>
                          
                          <td 
                            style={{ width: colWidths.jenis, minWidth: colWidths.jenis, maxWidth: colWidths.jenis }}
                            className="py-4 px-4 border-r border-slate-100/80"
                          >
                            <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-200/50 truncate max-w-full" title={item.jenis}>
                              {item.jenis}
                            </span>
                          </td>
                          
                          <td 
                            style={{ width: colWidths.temuan, minWidth: colWidths.temuan, maxWidth: colWidths.temuan }}
                            className="py-4 px-5 text-slate-600 leading-relaxed font-sans text-xs border-r border-slate-100/80"
                          >
                            <div className="break-words line-clamp-4 overflow-y-auto max-h-[120px] scrollbar-thin" title={item.temuan}>
                              {item.temuan}
                            </div>
                          </td>
                          
                          <td 
                            style={{ width: colWidths.kondisi, minWidth: colWidths.kondisi, maxWidth: colWidths.kondisi }}
                            className="py-4 px-5 text-slate-700 bg-sky-50/10 leading-relaxed font-sans text-xs border-r border-sky-100/60"
                          >
                            <div className="break-words whitespace-pre-wrap overflow-y-auto max-h-[140px] pr-1 scrollbar-thin scrollbar-thumb-sky-100" title={item.kondisi}>
                              {item.kondisi}
                            </div>
                          </td>
                          
                          <td 
                            style={{ width: colWidths.penyebab, minWidth: colWidths.penyebab, maxWidth: colWidths.penyebab }}
                            className="py-4 px-5 text-slate-600 bg-sky-50/10 leading-relaxed font-sans text-xs border-r border-sky-100/60"
                          >
                            <div className="break-words whitespace-pre-wrap overflow-y-auto max-h-[140px] pr-1 scrollbar-thin scrollbar-thumb-sky-100" title={item.penyebab}>
                              {item.penyebab}
                            </div>
                          </td>
                          
                          <td 
                            style={{ width: colWidths.risiko, minWidth: colWidths.risiko, maxWidth: colWidths.risiko }}
                            className="py-4 px-4 text-center border-r border-slate-100/80"
                          >
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                              item.risiko && item.risiko.toLowerCase().includes("tinggi") 
                                ? "bg-rose-50 border-rose-100 text-rose-700" 
                                : item.risiko && item.risiko.toLowerCase().includes("sedang") 
                                ? "bg-amber-50 border-amber-100 text-amber-700" 
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}>
                              {item.risiko}
                            </span>
                          </td>
                          
                          {/* Separated Rekomendasi */}
                          <td 
                            style={{ width: colWidths.rekomendasi, minWidth: colWidths.rekomendasi, maxWidth: colWidths.rekomendasi }}
                            className="py-4 px-5 text-slate-600 leading-relaxed text-xs border-r border-slate-100/80"
                          >
                            <div className="break-words line-clamp-4 overflow-y-auto max-h-[120px] scrollbar-thin" title={item.rekomendasi}>
                              {item.rekomendasi}
                            </div>
                          </td>

                          {/* Separated Action Plan */}
                          <td 
                            style={{ width: colWidths.plan, minWidth: colWidths.plan, maxWidth: colWidths.plan }}
                            className="py-4 px-5 text-indigo-950/90 leading-relaxed text-xs font-medium bg-slate-50/20 border-r border-slate-100/80"
                          >
                            <div className="break-words line-clamp-4 overflow-y-auto max-h-[120px] scrollbar-thin" title={item.plan}>
                              {item.plan}
                            </div>
                          </td>
                          
                          <td 
                            style={{ width: colWidths.sop, minWidth: colWidths.sop, maxWidth: colWidths.sop }}
                            className="py-4 px-4 bg-sky-50/10 border-r border-sky-100/60"
                          >
                            <div className="space-y-1.5 break-words">
                              <span className="inline-block text-[10px] font-mono font-bold bg-white px-2 py-1 rounded text-slate-700 border border-slate-200 break-words whitespace-pre-wrap leading-normal" title={item.sop}>
                                {item.sop}
                              </span>
                              {item.sk && item.sk !== "-" && item.sk !== "" && (
                                <span className="block text-[10px] text-slate-400 font-mono break-words whitespace-pre-wrap leading-snug" title={item.sk}>
                                  {item.sk}
                                </span>
                              )}
                            </div>
                          </td>
                          
                          <td 
                            style={{ width: colWidths.status, minWidth: colWidths.status, maxWidth: colWidths.status }}
                            className="py-4 px-5 text-center"
                          >
                            <div className="flex flex-col items-center space-y-2">
                              {item.status === "Selesai" ? (
                                <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                                  Selesai
                                </span>
                              ) : item.status === "On Progress" ? (
                                <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                                  On Progress
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5"></span>
                                  Void
                                </span>
                              )}
                              
                              {userRole === "admin" ? (
                                <div className="flex flex-col sm:flex-row gap-1.5 w-full justify-center">
                                  <button 
                                    onClick={() => setSelectedAudit(item)}
                                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer inline-flex items-center shadow-xs transition-colors hover:border-slate-300 justify-center"
                                  >
                                    <Settings2 className="w-3 h-3 mr-1 text-slate-400" />
                                    <span>Kelola</span>
                                  </button>
                                  <button 
                                    onClick={() => setConfirmDeleteId(item.id)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-[11px] font-bold rounded-lg cursor-pointer inline-flex items-center shadow-xs transition-colors hover:border-rose-200 justify-center"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1 text-rose-500" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/50">
                                  <Lock className="w-3 h-3 mr-1" /> Hanya Lihat
                                </span>
                              )}
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-semibold text-slate-500 font-mono">
                <span>PT. Solusi Integrasi Pratama &copy; 2026. Internal Corporate Audit.</span>
                <span>Menampilkan {filteredAudits.length} data hasil temuan aktif.</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: DASHBOARD REKOMENDASI SANKSI */}
        {activeTab === "sanksi" && (
          <div className="space-y-6">
            
            {/* KPI STATS CARDS FOR SANCTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-amber-500 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Total PIC Terkena Sanksi</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1.5 font-display tracking-tight">
                    {loadingSanctions ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : totalSanctionsCount}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Seluruh PIC wilayah kepatuhan</span>
                </div>
                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                  <Scale className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-emerald-500 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600/95 uppercase tracking-wider font-display">Status Sanksi: Active</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1.5 font-display tracking-tight">
                    {loadingSanctions ? <Loader2 className="w-6 h-6 animate-spin text-emerald-400" /> : activeSanctionsCount}
                  </p>
                  <span className="text-[10px] text-emerald-600/70 font-medium block mt-1">Rekomendasi sanksi aktif berlaku</span>
                </div>
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-slate-400 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-display">Status Sanksi: Inactive</p>
                  <p className="text-3xl font-extrabold text-slate-500 mt-1.5 font-display tracking-tight">
                    {loadingSanctions ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : inactiveSanctionsCount}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">Sanksi tidak aktif / ditangguhkan</span>
                </div>
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
                  <X className="w-6 h-6 text-slate-500" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-amber-500 border border-slate-200/80 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                <div>
                  <p className="text-[10px] font-bold text-amber-600/95 uppercase tracking-wider font-display">Status Sanksi: Terminated</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-1.5 font-display tracking-tight">
                    {loadingSanctions ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : terminatedSanctionsCount}
                  </p>
                  <span className="text-[10px] text-amber-600/70 font-medium block mt-1">Sanksi selesai / diakhiri</span>
                </div>
                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
              </div>

            </div>

                {/* FILTERS & SEARCH CONTROLS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 font-mono">Penyaringan Data Rekomendasi Sanksi</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Clear Filter */}
                  {(filterSanctionRegion !== "ALL" || filterSanctionWilayah !== "ALL" || filterSanctionStatus !== "ALL" || searchSanctionQuery !== "") && (
                    <button 
                      onClick={() => {
                        setFilterSanctionRegion("ALL");
                        setFilterSanctionWilayah("ALL");
                        setFilterSanctionStatus("ALL");
                        setSearchSanctionQuery("");
                        showToast("Penyaringan sanksi dibersihkan.", "info");
                      }}
                      className="px-3.5 py-2 bg-slate-100 text-slate-600 hover:text-slate-800 text-[11px] font-bold rounded-xl cursor-pointer transition-all border border-slate-200 hover:bg-slate-200 flex items-center"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Clear Filters</span>
                    </button>
                  )}

                  {/* Export Excel Button */}
                  <button 
                    onClick={handleExportSanctionExcel}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl cursor-pointer shadow-md hover:shadow-emerald-600/10 transition-all flex items-center"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    <span>Export Excel Laporan (.xlsx)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search query */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Pencarian Umum</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={searchSanctionQuery}
                      onChange={(e) => setSearchSanctionQuery(e.target.value)}
                      placeholder="Cari PIC, Auditor, Temuan..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-semibold shadow-xs"
                    />
                  </div>
                </div>

                {/* Region filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Region Operasional</label>
                  <select 
                    value={filterSanctionRegion}
                    onChange={(e) => handleSanctionRegionFilterChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer shadow-xs transition-all hover:bg-slate-100"
                  >
                    <option value="ALL">Semua Region (Nasional)</option>
                    {Object.keys(regionMapping).map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                {/* Wilayah filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Wilayah Cakupan</label>
                  <select 
                    value={filterSanctionWilayah}
                    onChange={(e) => setFilterSanctionWilayah(e.target.value)}
                    disabled={filterSanctionRegion === "ALL"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer shadow-xs disabled:opacity-50 transition-all hover:bg-slate-100"
                  >
                    <option value="ALL">Semua Wilayah</option>
                    {filterSanctionRegion !== "ALL" && regionMapping[filterSanctionRegion]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Status Sanksi filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Status Sanksi</label>
                  <select 
                    value={filterSanctionStatus}
                    onChange={(e) => setFilterSanctionStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer shadow-xs transition-all hover:bg-slate-100"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SPREADSHEET TABLE CARD FOR SANCTIONS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FAFBFD]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <Scale className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider font-mono">Laporan Rekomendasi & Implementasi Sanksi</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Berdasarkan data temuan audit internal yang disetujui</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-bold font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Total Laporan Terfilter: <span className="text-amber-600 font-extrabold">{filteredSanctions.length} Baris</span>
                </div>
              </div>

              {/* Responsive table wrapper */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto min-w-[1500px]">
                  <thead>
                    <tr className="bg-[#1E293B] text-slate-100 text-[10px] font-bold uppercase tracking-wider border-b border-slate-300 font-mono">
                      <th className="py-3 px-4 text-center w-[50px] border-r border-slate-700/50">No</th>
                      <th className="py-3 px-4 min-w-[150px] border-r border-slate-700/50">Auditor</th>
                      <th className="py-3 px-4 min-w-[110px] border-r border-slate-700/50">Periode Awal</th>
                      <th className="py-3 px-4 min-w-[110px] border-r border-slate-700/50">Periode Akhir</th>
                      <th className="py-3 px-4 min-w-[130px] border-r border-slate-700/50">Regional</th>
                      <th className="py-3 px-4 min-w-[130px] border-r border-slate-700/50">Wilayah</th>
                      <th className="py-3 px-4 min-w-[160px] border-r border-slate-700/50">Nama PIC</th>
                      <th className="py-3 px-5 min-w-[200px] border-r border-slate-700/50">Jenis Temuan</th>
                      <th className="py-3 px-5 min-w-[220px] border-r border-slate-700/50 bg-[#2D3748] text-amber-300 font-extrabold">Rekomendasi Sanksi</th>
                      <th className="py-3 px-5 min-w-[220px] border-r border-slate-700/50">Implementasi Sanksi</th>
                      <th className="py-3 px-5 min-w-[180px] border-r border-slate-700/50">Catatan Tambahan</th>
                      <th className="py-3 px-4 min-w-[140px] border-r border-slate-700/50 text-center">Status Sanksi</th>
                      {userRole === "admin" && <th className="py-3 px-4 min-w-[140px] text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loadingSanctions ? (
                      <tr>
                        <td colSpan={userRole === "admin" ? 13 : 12} className="py-12 text-center text-slate-500 font-semibold font-mono">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            <span>Sedang memuat data rekomendasi sanksi...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredSanctions.length === 0 ? (
                      <tr>
                        <td colSpan={userRole === "admin" ? 13 : 12} className="py-16 text-center text-slate-400">
                          <div className="max-w-md mx-auto space-y-3">
                            <Scale className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">Tidak Ada Data Rekomendasi Sanksi</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed">Silakan sesuaikan filter penyaringan atau unggah berkas excel sanksi baru di portal input.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSanctions.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors text-xs font-medium text-slate-800">
                          <td className="py-3 px-3 text-center text-slate-500 font-mono font-bold bg-slate-50 border-r border-slate-100">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-semibold">
                            {item.auditor}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono text-[11px] text-slate-600">
                            {item.periodeAwal}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono text-[11px] text-slate-600">
                            {item.periodeAkhir}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-slate-600">
                            {item.region}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-slate-600">
                            {item.wilayah}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-indigo-900 font-bold">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                              <span>{item.namaPic}</span>
                            </div>
                          </td>
                          <td className="py-3 px-5 border-r border-slate-100 leading-relaxed text-slate-600">
                            <div className="line-clamp-3" title={item.jenisTemuan}>
                              {item.jenisTemuan}
                            </div>
                          </td>
                          <td className="py-3 px-5 border-r border-slate-100 leading-relaxed bg-amber-50/40 text-amber-950 font-bold">
                            <div className="line-clamp-3" title={item.rekomendasiSanksi}>
                              {item.rekomendasiSanksi}
                            </div>
                          </td>
                          <td className="py-3 px-5 border-r border-slate-100 leading-relaxed text-slate-600">
                            <div className="line-clamp-3 text-slate-700" title={item.implementasiSanksi}>
                              {item.implementasiSanksi}
                            </div>
                          </td>
                          <td className="py-3 px-5 border-r border-slate-100 leading-relaxed text-slate-500 text-[11px]">
                            <div className="line-clamp-3" title={item.catatanTambahan}>
                              {item.catatanTambahan || "-"}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center">
                            <div className="flex justify-center">
                              {item.statusSanksi === "Active" ? (
                                <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                                  Active
                                </span>
                              ) : item.statusSanksi === "Inactive" ? (
                                <span className="inline-flex items-center bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5"></span>
                                  Inactive
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                                  Terminated
                                </span>
                              )}
                            </div>
                          </td>
                          {userRole === "admin" && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button 
                                  onClick={() => setSelectedSanction(item)}
                                  className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer inline-flex items-center shadow-xs transition-colors hover:border-slate-300"
                                >
                                  <Settings2 className="w-3 h-3 mr-1 text-slate-400" />
                                  <span>Kelola</span>
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteSanctionId(item.id)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-[11px] font-bold rounded-lg cursor-pointer inline-flex items-center shadow-xs transition-colors hover:border-rose-200"
                                >
                                  <Trash2 className="w-3 h-3 mr-1 text-rose-500" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-semibold text-slate-500 font-mono">
                <span>PT. Solusi Integrasi Pratama &copy; 2026. Laporan Rekomendasi Sanksi.</span>
                <span>Menampilkan {filteredSanctions.length} data rekomendasi sanksi aktif.</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: PORTAL INPUT REKOMENDASI SANKSI */}
        {activeTab === "input_sanksi" && userRole === "admin" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            
            {/* METHOD A: UPLOAD EXCEL FOR SANCTIONS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center space-x-3.5 pb-4 border-b border-slate-100 mb-6">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-850 uppercase tracking-widest font-mono">Metode A: Upload via Excel Sanksi</h2>
                  <p className="text-xs text-slate-500 mt-1">Unggah file kerja (.xlsx / .xls / .csv) untuk menginput banyak data sanksi secara bersamaan.</p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.preventDefault();
                  setExcelDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    processSanctionExcelFile(file);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-350 relative group cursor-pointer ${
                  excelDragOver 
                    ? "border-emerald-500 bg-emerald-50/30 scale-[1.01]" 
                    : "border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/10"
                }`}
              >
                <input 
                  type="file" 
                  id="excel-sanction-file-input" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleSanctionExcelUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center text-emerald-600 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    <span className="text-emerald-600 font-bold hover:underline">Klik untuk pilih file</span> atau seret file Excel Sanksi Anda ke sini
                  </div>
                  <p className="text-xs text-slate-400">Mendukung file format spreadsheet sanksi standar (.xlsx, .xls, .csv)</p>
                </div>
              </div>

              {/* Rules expander */}
              <div className="mt-5 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs text-slate-600 shadow-xs">
                <span className="font-medium flex items-center">
                  <Info className="w-4.5 h-4.5 text-sky-500 mr-2.5 flex-shrink-0" />
                  Gunakan nama kolom header sanksi yang sesuai agar sistem dapat mendeteksi data secara presisi.
                </span>
                <button 
                  onClick={() => setShowExcelSanctionRuleDialog(true)}
                  className="text-sky-600 font-bold hover:text-sky-800 hover:underline cursor-pointer flex-shrink-0 font-mono"
                >
                  Lihat Aturan Kolom Sanksi
                </button>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-250"></div>
              <span className="flex-shrink mx-5 text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">ATAU</span>
              <div className="flex-grow border-t border-slate-250"></div>
            </div>

            {/* METHOD B: MANUAL INPUT FORM FOR SANCTIONS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center space-x-3.5 pb-5 border-b border-slate-100 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shadow-xs">
                  <Keyboard className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-850 uppercase tracking-widest font-mono">Metode B: Input Manual Rekomendasi Sanksi</h2>
                  <p className="text-xs text-slate-500 mt-1">Gunakan formulir di bawah ini jika hanya ingin menambah satu baris data sanksi baru.</p>
                </div>
              </div>

              <form onSubmit={handleManualSanctionSubmit} className="space-y-6 text-slate-700">
                
                {/* Auditor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Auditor *</label>
                  <input 
                    type="text"
                    value={formSanctionAuditor}
                    onChange={(e) => setFormSanctionAuditor(e.target.value)}
                    required
                    placeholder="Masukkan nama lengkap auditor..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                  />
                </div>

                {/* Periode Audit (Awal & Akhir) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Periode Awal Sanksi *</label>
                    <input 
                      type="date"
                      value={formSanctionPeriodeAwal}
                      onChange={(e) => setFormSanctionPeriodeAwal(e.target.value)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Periode Akhir Sanksi *</label>
                    <input 
                      type="date"
                      value={formSanctionPeriodeAkhir}
                      onChange={(e) => setFormSanctionPeriodeAkhir(e.target.value)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                </div>

                {/* Region & Wilayah Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Region Wilayah *</label>
                    <select 
                      value={formSanctionRegion}
                      onChange={(e) => handleSanctionFormRegionChange(e.target.value)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Region Wilayah</option>
                      {Object.keys(regionMapping).map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Wilayah Cakupan *</label>
                    <select 
                      value={formSanctionWilayah}
                      onChange={(e) => setFormSanctionWilayah(e.target.value)}
                      required
                      disabled={!formSanctionRegion}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer shadow-xs disabled:opacity-50 transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Wilayah Cakupan</option>
                      {formSanctionRegion && regionMapping[formSanctionRegion]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nama PIC & Jenis Temuan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Nama PIC Terkena Sanksi *</label>
                    <input 
                      type="text"
                      value={formSanctionNamaPic}
                      onChange={(e) => setFormSanctionNamaPic(e.target.value)}
                      required
                      placeholder="Masukkan nama PIC..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Jenis Temuan Audit *</label>
                    <input 
                      type="text"
                      value={formSanctionJenisTemuan}
                      onChange={(e) => setFormSanctionJenisTemuan(e.target.value)}
                      required
                      placeholder="Masukkan kategori/jenis temuan..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Rekomendasi Sanksi */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Rekomendasi Sanksi *</label>
                  <textarea 
                    rows={3}
                    value={formSanctionRekomendasiSanksi}
                    onChange={(e) => setFormSanctionRekomendasiSanksi(e.target.value)}
                    required
                    placeholder="Uraikan rekomendasi sanksi yang diusulkan oleh tim auditor..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                  />
                </div>

                {/* Implementasi Sanksi & Catatan Tambahan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Implementasi Sanksi</label>
                    <textarea 
                      rows={2}
                      value={formSanctionImplementasiSanksi}
                      onChange={(e) => setFormSanctionImplementasiSanksi(e.target.value)}
                      placeholder="Uraikan realisasi pelaksanaan sanksi jika ada... (Opsional)"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Catatan Tambahan</label>
                    <textarea 
                      rows={2}
                      value={formSanctionCatatanTambahan}
                      onChange={(e) => setFormSanctionCatatanTambahan(e.target.value)}
                      placeholder="Masukkan catatan pendukung lainnya... (Opsional)"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Status Sanksi Selection Cards */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono">Status Rekomendasi Sanksi *</label>
                  <div className="grid grid-cols-3 gap-4">
                    
                    <button 
                      type="button"
                      onClick={() => setFormSanctionStatusSanksi("Active")}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        formSanctionStatusSanksi === "Active"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
                      Active
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFormSanctionStatusSanksi("Inactive")}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        formSanctionStatusSanksi === "Inactive"
                          ? "bg-slate-100 border-slate-500 text-slate-800 ring-2 ring-slate-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full mr-2"></span>
                      Inactive
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFormSanctionStatusSanksi("Terminated")}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        formSanctionStatusSanksi === "Terminated"
                          ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2"></span>
                      Terminated
                    </button>

                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-5 flex justify-end space-x-4 border-t border-slate-100">
                  <button 
                    type="reset" 
                    onClick={() => {
                      setFormSanctionAuditor("");
                      setFormSanctionPeriodeAwal("");
                      setFormSanctionPeriodeAkhir("");
                      setFormSanctionRegion("");
                      setFormSanctionWilayah("");
                      setFormSanctionNamaPic("");
                      setFormSanctionJenisTemuan("");
                      setFormSanctionRekomendasiSanksi("");
                      setFormSanctionImplementasiSanksi("");
                      setFormSanctionCatatanTambahan("");
                      setFormSanctionStatusSanksi("Active");
                    }}
                    className="px-5 py-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer transition-all hover:text-slate-850"
                  >
                    Reset Form
                  </button>
                  
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-[#0B1528] hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center transition-all border border-[#1E2E4A]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span>Simpan Satu Rekomendasi</span>
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

        {/* TAB 2: PORTAL INPUT HASIL AUDIT */}
        {activeTab === "input" && userRole === "admin" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            
            {/* METHOD A: UPLOAD EXCEL */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center space-x-3.5 pb-4 border-b border-slate-100 mb-6">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-850 uppercase tracking-widest font-mono">Metode A: Upload via Excel</h2>
                  <p className="text-xs text-slate-500 mt-1">Unggah file kerja (.xlsx / .xls / .csv) untuk menginput banyak data secara bersamaan.</p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-350 relative group cursor-pointer ${
                  excelDragOver 
                    ? "border-emerald-500 bg-emerald-50/30 scale-[1.01]" 
                    : "border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/10"
                }`}
              >
                <input 
                  type="file" 
                  id="excel-file-input" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleExcelUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center text-emerald-600 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    <span className="text-emerald-600 font-bold hover:underline">Klik untuk pilih file</span> atau seret file Excel Anda ke sini
                  </div>
                  <p className="text-xs text-slate-400">Mendukung file format spreadsheet standar (.xlsx, .xls, .csv)</p>
                </div>
              </div>

              {/* Rules expander */}
              <div className="mt-5 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs text-slate-600 shadow-xs">
                <span className="font-medium flex items-center">
                  <Info className="w-4.5 h-4.5 text-sky-500 mr-2.5 flex-shrink-0" />
                  Gunakan nama kolom header yang sesuai agar sistem dapat mendeteksi data secara presisi.
                </span>
                <button 
                  onClick={() => setShowExcelRuleDialog(true)}
                  className="text-sky-600 font-bold hover:text-sky-800 hover:underline cursor-pointer flex-shrink-0 font-mono"
                >
                  Lihat Aturan Kolom
                </button>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-250"></div>
              <span className="flex-shrink mx-5 text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">ATAU</span>
              <div className="flex-grow border-t border-slate-250"></div>
            </div>

            {/* METHOD B: MANUAL INPUT FORM */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center space-x-3.5 pb-5 border-b border-slate-100 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shadow-xs">
                  <Keyboard className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-850 uppercase tracking-widest font-mono">Metode B: Input Manual</h2>
                  <p className="text-xs text-slate-500 mt-1">Gunakan formulir di bawah ini jika hanya ingin menambah satu baris data temuan.</p>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-6 text-slate-700">
                
                {/* Auditor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Auditor *</label>
                  <input 
                    type="text"
                    value={formAuditor}
                    onChange={(e) => setFormAuditor(e.target.value)}
                    required
                    placeholder="Masukkan nama lengkap auditor..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Periode Audit (Awal & Akhir) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Periode Awal *</label>
                    <input 
                      type="date"
                      value={formPeriodeAwal}
                      onChange={(e) => setFormPeriodeAwal(e.target.value)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Periode Akhir *</label>
                    <input 
                      type="date"
                      value={formPeriodeAkhir}
                      onChange={(e) => setFormPeriodeAkhir(e.target.value)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                </div>

                {/* Region & Wilayah Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Region Wilayah *</label>
                    <select 
                      value={formRegion}
                      onChange={(e) => handleFormRegionChange(e.target.value)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Region Wilayah</option>
                      {Object.keys(regionMapping).map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Wilayah Cakupan *</label>
                    <select 
                      value={formWilayah}
                      onChange={(e) => setFormWilayah(e.target.value)}
                      required
                      disabled={!formRegion}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 cursor-pointer shadow-xs disabled:opacity-50 transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Wilayah Cakupan</option>
                      {formRegion && regionMapping[formRegion]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Jenis Audit */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Jenis Audit *</label>
                  <select 
                    value={formJenis}
                    onChange={(e) => setFormJenis(e.target.value)}
                    required
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                  >
                    <option value="" disabled>Pilih Jenis Audit</option>
                    <option value="Audit Operasional">Audit Operasional</option>
                    <option value="Audit Spesial">Audit Spesial</option>
                  </select>
                </div>

                {/* Temuan Audit */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Temuan Audit *</label>
                  <textarea 
                    rows={3}
                    value={formTemuan}
                    onChange={(e) => setFormTemuan(e.target.value)}
                    required
                    placeholder="Uraikan detail ketidaksesuaian atau temuan hasil audit..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Kondisi Permasalahan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Kondisi Permasalahan *</label>
                  <textarea 
                    rows={3}
                    value={formKondisi}
                    onChange={(e) => setFormKondisi(e.target.value)}
                    required
                    placeholder="Uraikan kondisi riil permasalahan yang sedang terjadi di lapangan..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Penyebab Utama */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Penyebab Utama *</label>
                  <textarea 
                    rows={3}
                    value={formPenyebab}
                    onChange={(e) => setFormPenyebab(e.target.value)}
                    required
                    placeholder="Uraikan akar penyebab masalah ditemukan..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Risiko Teridentifikasi */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Risiko Teridentifikasi</label>
                  <input 
                    type="text"
                    value={formRisiko}
                    onChange={(e) => setFormRisiko(e.target.value)}
                    placeholder="Contoh: Tinggi - Potensi kerugian finansial (Opsional)"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Rekomendasi & Action Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Rekomendasi *</label>
                    <textarea 
                      rows={2}
                      value={formRekomendasi}
                      onChange={(e) => setFormRekomendasi(e.target.value)}
                      required
                      placeholder="Langkah perbaikan yang disarankan..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Action Plan</label>
                    <textarea 
                      rows={2}
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value)}
                      placeholder="Tindak lanjut eksekusi tim... (Opsional)"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* SOP/SK/IOM Acuan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">SOP/SK/IOM Acuan</label>
                  <input 
                    type="text"
                    value={formSop}
                    onChange={(e) => setFormSop(e.target.value)}
                    placeholder="Contoh: SOP-OPS-044 / SK-124/SIP/2025"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Status Selection Cards */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono">Status Hasil Audit Internal *</label>
                  <div className="grid grid-cols-3 gap-4">
                    
                    <button 
                      type="button"
                      onClick={() => setFormStatus("Selesai")}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        formStatus === "Selesai"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
                      Selesai
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFormStatus("On Progress")}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        formStatus === "On Progress"
                          ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2"></span>
                      On Progress
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFormStatus("Void")}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        formStatus === "Void"
                          ? "bg-slate-100 border-slate-500 text-slate-800 ring-2 ring-slate-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full mr-2"></span>
                      Void
                    </button>

                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-5 flex justify-end space-x-4 border-t border-slate-100">
                  <button 
                    type="reset" 
                    onClick={() => {
                      setFormRegion("");
                      setFormWilayah("");
                      setFormJenis("");
                      setFormTemuan("");
                      setFormPenyebab("");
                      setFormRisiko("");
                      setFormRekomendasi("");
                      setFormPlan("");
                      setFormSop("");
                      setFormSk("");
                      setFormStatus("On Progress");
                    }}
                    className="px-5 py-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer transition-all hover:text-slate-850"
                  >
                    Reset Form
                  </button>
                  
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-[#0B1528] hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center transition-all border border-[#1E2E4A]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span>Simpan Satu Laporan</span>
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0F172A] text-slate-400 text-xs py-8 border-t border-[#1E293B] mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="text-slate-400 text-xs text-left">
            <span className="font-semibold text-slate-300">Wewenang Akses:</span> {userRole === "admin" ? "Sistem penuh (Super Admin)" : "Hanya Lihat (Viewer)"}
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="font-bold text-white">PT. Solusi Integrasi Pratama &copy; 2026. Internal Corporate Audit System.</p>
            <p className="text-[10px] text-slate-400 font-mono">Aplikasi Sistem Manajemen Audit Internal Kepatuhan Operasional Regional.</p>
          </div>

        </div>
      </footer>

      {/* MODAL: EXCEL RULE DETAILS */}
      <AnimatePresence>
        {showExcelRuleDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg p-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 mr-2" />
                  Aturan Struktur Kolom Excel
                </h3>
                <button 
                  onClick={() => setShowExcelRuleDialog(false)} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                <p>Pastikan baris pertama spreadsheet Excel Anda (Header Kolom) berisi nama kolom persis atau mirip dengan kriteria berikut:</p>
                
                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
                  <div><strong>Auditor</strong> <span className="text-slate-400">(Nama auditor, contoh: Andi Wijaya)</span></div>
                  <div><strong>Periode Awal</strong> <span className="text-slate-400">(Tanggal mulai audit, contoh: 2026-01-01)</span></div>
                  <div><strong>Periode Akhir</strong> <span className="text-slate-400">(Tanggal selesai audit, contoh: 2026-06-30)</span></div>
                  <div><strong>Region</strong> <span className="text-slate-400">(Sumatera, Jabodetabek, dsb)</span></div>
                  <div><strong>Wilayah</strong> <span className="text-slate-400">(Nama Kota: Medan, Depok, dsb)</span></div>
                  <div><strong>Jenis Audit</strong> <span className="text-slate-400">(Audit Operasional, dsb)</span></div>
                  <div><strong>Temuan Audit</strong> <span className="text-slate-400">(Uraian temuan kasus)</span></div>
                  <div><strong>Kondisi Permasalahan</strong> <span className="text-slate-400">(Uraian kondisi riil permasalahan)</span></div>
                  <div><strong>Penyebab Utama</strong> <span className="text-slate-400">(Uraian akar penyebab)</span></div>
                  <div><strong>Risiko</strong> <span className="text-slate-400">(Uraian tingkat risiko - Opsional)</span></div>
                  <div><strong>Rekomendasi</strong> <span className="text-slate-400">(Uraian rekomendasi perbaikan)</span></div>
                  <div><strong>Action Plan</strong> <span className="text-slate-400">(Langkah penanganan - Opsional)</span></div>
                  <div><strong>SOP/SK/IOM Acuan</strong> <span className="text-slate-400">(Kode dokumen SOP/SK/IOM)</span></div>
                  <div><strong>Status</strong> <span className="text-slate-400">(Selesai, On Progress, atau Void)</span></div>
                </div>

                <p className="text-[11px] text-amber-600 font-semibold bg-amber-50 p-2.5 rounded border border-amber-100">
                  * Catatan: Sistem akan secara otomatis menetapkan status "On Progress" apabila kolom status dikosongkan atau tidak dikenali.
                </p>
              </div>

              <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
                <button 
                  onClick={() => setShowExcelRuleDialog(false)}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EXCEL SANCTION RULE DETAILS */}
      <AnimatePresence>
        {showExcelSanctionRuleDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg p-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 mr-2" />
                  Aturan Struktur Kolom Excel Sanksi
                </h3>
                <button 
                  onClick={() => setShowExcelSanctionRuleDialog(false)} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                <p>Pastikan baris pertama spreadsheet Excel Anda (Header Kolom) berisi nama kolom persis atau mirip dengan kriteria berikut:</p>
                
                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1 overflow-y-auto max-h-[300px]">
                  <div><strong>Auditor</strong> <span className="text-slate-400">(Nama auditor, contoh: Andi Wijaya)</span></div>
                  <div><strong>Periode Awal</strong> <span className="text-slate-400">(Tanggal mulai audit, contoh: 2026-01-01)</span></div>
                  <div><strong>Periode Akhir</strong> <span className="text-slate-400">(Tanggal selesai audit, contoh: 2026-06-30)</span></div>
                  <div><strong>Region</strong> <span className="text-slate-400">(Sumatera, Jabodetabek, dsb)</span></div>
                  <div><strong>Wilayah</strong> <span className="text-slate-400">(Nama Kota: Medan, Depok, dsb)</span></div>
                  <div><strong>Nama PIC</strong> <span className="text-slate-400">(Nama PIC yang dikenakan sanksi)</span></div>
                  <div><strong>Jenis Temuan</strong> <span className="text-slate-400">(Uraian kategori temuan kasus)</span></div>
                  <div><strong>Rekomendasi Sanksi</strong> <span className="text-slate-400">(Uraian sanksi yang direkomendasikan)</span></div>
                  <div><strong>Implementasi Sanksi</strong> <span className="text-slate-400">(Uraian realisasi sanksi - Opsional)</span></div>
                  <div><strong>Catatan Tambahan</strong> <span className="text-slate-400">(Catatan tambahan - Opsional)</span></div>
                  <div><strong>Status Sanksi</strong> <span className="text-slate-400">(Active, Inactive, atau Terminated)</span></div>
                </div>

                <p className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 p-2.5 rounded border border-emerald-100">
                  * Catatan: Sistem akan secara otomatis menetapkan status "Active" apabila kolom status dikosongkan atau tidak dikenali.
                </p>
              </div>

              <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
                <button 
                  onClick={() => setShowExcelSanctionRuleDialog(false)}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KELOLA STATUS AUDIT */}
      <AnimatePresence>
        {selectedAudit && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 max-h-[90vh] flex flex-col"
            >
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center">
                  <Settings2 className="w-5 h-5 text-sky-500 mr-2 animate-spin-slow" />
                  Kelola & Edit Hasil Audit
                </h3>
                <button 
                  onClick={() => setSelectedAudit(null)} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Container */}
              <div className="space-y-5 overflow-y-auto pr-2 py-1 flex-grow text-slate-700">
                
                {/* Auditor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Auditor *</label>
                  <input 
                    type="text"
                    value={editForm.auditor || ""}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, auditor: e.target.value } : null)}
                    required
                    placeholder="Nama lengkap auditor..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Periode Audit (Awal & Akhir) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Periode Awal *</label>
                    <input 
                      type="date"
                      value={formatDateToYMD(editForm.periodeAwal)}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, periodeAwal: e.target.value } : null)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Periode Akhir *</label>
                    <input 
                      type="date"
                      value={formatDateToYMD(editForm.periodeAkhir)}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, periodeAkhir: e.target.value } : null)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                </div>

                {/* Region & Wilayah Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Region Wilayah *</label>
                    <select 
                      value={editForm.region || ""}
                      onChange={(e) => {
                        const nextRegion = e.target.value;
                        const defaultCity = regionMapping[nextRegion]?.[0] || "";
                        setEditForm(prev => prev ? { ...prev, region: nextRegion, wilayah: defaultCity } : null);
                      }}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Region Wilayah</option>
                      {Object.keys(regionMapping).map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Wilayah Cakupan *</label>
                    <select 
                      value={editForm.wilayah || ""}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, wilayah: e.target.value } : null)}
                      required
                      disabled={!editForm.region}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 cursor-pointer shadow-xs disabled:opacity-50 transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Wilayah Cakupan</option>
                      {editForm.region && regionMapping[editForm.region]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Jenis Audit */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Jenis Audit *</label>
                  <select 
                    value={editForm.jenis || ""}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, jenis: e.target.value } : null)}
                    required
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                  >
                    <option value="" disabled>Pilih Jenis Audit</option>
                    <option value="Audit Operasional">Audit Operasional</option>
                    <option value="Audit Spesial">Audit Spesial</option>
                  </select>
                </div>

                {/* Temuan Audit */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Temuan Audit *</label>
                  <textarea 
                    rows={2}
                    value={editForm.temuan || ""}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, temuan: e.target.value } : null)}
                    required
                    placeholder="Uraikan detail temuan hasil audit..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Kondisi Permasalahan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Kondisi Permasalahan *</label>
                  <textarea 
                    rows={2}
                    value={editForm.kondisi || ""}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, kondisi: e.target.value } : null)}
                    required
                    placeholder="Uraikan kondisi riil di lapangan..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Penyebab Utama */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Penyebab Utama *</label>
                  <textarea 
                    rows={2}
                    value={editForm.penyebab || ""}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, penyebab: e.target.value } : null)}
                    required
                    placeholder="Uraikan akar penyebab masalah..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Risiko */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Risiko Teridentifikasi</label>
                  <input 
                    type="text"
                    value={editForm.risiko || ""}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, risiko: e.target.value } : null)}
                    placeholder="Tingkat risiko dan dampaknya..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Rekomendasi & Action Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Rekomendasi *</label>
                    <textarea 
                      rows={2}
                      value={editForm.rekomendasi || ""}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, rekomendasi: e.target.value } : null)}
                      required
                      placeholder="Langkah perbaikan..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Action Plan</label>
                    <textarea 
                      rows={2}
                      value={editForm.plan || ""}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, plan: e.target.value } : null)}
                      placeholder="Tindak lanjut eksekusi..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* SOP/SK/IOM Acuan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">SOP/SK/IOM Acuan</label>
                    <input 
                      type="text"
                      value={editForm.sop || ""}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, sop: e.target.value } : null)}
                      placeholder="SOP-OPS-044, dsb..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">SK Acuan Tambahan</label>
                    <input 
                      type="text"
                      value={editForm.sk || ""}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, sk: e.target.value } : null)}
                      placeholder="SK-124/SIP/2025, dsb..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Status Selection Buttons */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 font-mono">Status Hasil Audit Internal *</label>
                  <div className="grid grid-cols-3 gap-3">
                    
                    <button 
                      type="button"
                      onClick={() => setEditForm(prev => prev ? { ...prev, status: "Selesai" } : null)}
                      className={`flex items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editForm.status === "Selesai"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10"
                          : "bg-[#F8FAFC] border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Selesai
                    </button>

                    <button 
                      type="button"
                      onClick={() => setEditForm(prev => prev ? { ...prev, status: "On Progress" } : null)}
                      className={`flex items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editForm.status === "On Progress"
                          ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/10"
                          : "bg-[#F8FAFC] border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                      On Progress
                    </button>

                    <button 
                      type="button"
                      onClick={() => setEditForm(prev => prev ? { ...prev, status: "Void" } : null)}
                      className={`flex items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editForm.status === "Void"
                          ? "bg-slate-100 border-slate-500 text-slate-800 ring-2 ring-slate-500/10"
                          : "bg-[#F8FAFC] border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                      Void
                    </button>

                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex justify-end space-x-3 pt-4 border-t border-slate-100 flex-shrink-0">
                <button 
                  onClick={() => setSelectedAudit(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer transition-all"
                >
                  Batal
                </button>
                
                <button 
                  onClick={handleSaveStatusUpdate}
                  disabled={updatingStatus}
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md hover:shadow-slate-800/10 transition-all inline-flex items-center"
                >
                  {updatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KONFIRMASI HAPUS TEMUAN AUDIT (Super User Only) */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 overflow-hidden"
            >
              
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 mb-4 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Konfirmasi Hapus Data
                </h3>
              </div>

              <div className="space-y-3.5">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data laporan temuan audit ini secara permanen dari database server? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                </p>

                {(() => {
                  const auditToDel = audits.find(a => a.id === confirmDeleteId);
                  if (!auditToDel) return null;
                  return (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1.5 font-sans">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                        <span>LOKASI UNIT</span>
                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase text-[9px] font-extrabold tracking-wider">CONFIDENTIAL</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {auditToDel.region} - {auditToDel.wilayah}
                      </p>
                      <div className="text-[10px] font-bold text-slate-400 font-mono pt-1">
                        RINGKASAN TEMUAN
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {auditToDel.temuan}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deletingId}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                
                <button 
                  onClick={() => confirmDeleteId !== null && handleDeleteAudit(confirmDeleteId)}
                  disabled={deletingId}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md hover:shadow-rose-600/10 transition-all inline-flex items-center"
                >
                  {deletingId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Hapus Permanen</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KELOLA STATUS SANKSI */}
      <AnimatePresence>
        {selectedSanction && editSanctionForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 max-h-[90vh] flex flex-col"
            >
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center">
                  <Settings2 className="w-5 h-5 text-amber-500 mr-2 animate-spin-slow" />
                  Kelola & Edit Rekomendasi Sanksi
                </h3>
                <button 
                  onClick={() => setSelectedSanction(null)} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Container */}
              <div className="space-y-5 overflow-y-auto pr-2 py-1 flex-grow text-slate-700">
                
                {/* Auditor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Auditor *</label>
                  <input 
                    type="text"
                    value={editSanctionForm.auditor || ""}
                    onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, auditor: e.target.value } : null)}
                    required
                    placeholder="Nama lengkap auditor..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                  />
                </div>

                {/* Periode Sanksi (Awal & Akhir) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Periode Awal *</label>
                    <input 
                      type="date"
                      value={formatDateToYMD(editSanctionForm.periodeAwal)}
                      onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, periodeAwal: e.target.value } : null)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Periode Akhir *</label>
                    <input 
                      type="date"
                      value={formatDateToYMD(editSanctionForm.periodeAkhir)}
                      onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, periodeAkhir: e.target.value } : null)}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                </div>

                {/* Region & Wilayah Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Region Wilayah *</label>
                    <select 
                      value={editSanctionForm.region || ""}
                      onChange={(e) => {
                        const nextRegion = e.target.value;
                        const defaultCity = regionMapping[nextRegion]?.[0] || "";
                        setEditSanctionForm(prev => prev ? { ...prev, region: nextRegion, wilayah: defaultCity } : null);
                      }}
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer shadow-xs transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Region Wilayah</option>
                      {Object.keys(regionMapping).map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Wilayah Cakupan *</label>
                    <select 
                      value={editSanctionForm.wilayah || ""}
                      onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, wilayah: e.target.value } : null)}
                      required
                      disabled={!editSanctionForm.region}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer shadow-xs disabled:opacity-50 transition-all hover:bg-slate-50"
                    >
                      <option value="" disabled>Pilih Wilayah Cakupan</option>
                      {editSanctionForm.region && regionMapping[editSanctionForm.region]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nama PIC & Jenis Temuan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Nama PIC Terkena Sanksi *</label>
                    <input 
                      type="text"
                      value={editSanctionForm.namaPic || ""}
                      onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, namaPic: e.target.value } : null)}
                      required
                      placeholder="Masukkan nama PIC..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Jenis Temuan *</label>
                    <input 
                      type="text"
                      value={editSanctionForm.jenisTemuan || ""}
                      onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, jenisTemuan: e.target.value } : null)}
                      required
                      placeholder="Masukkan jenis temuan..."
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Rekomendasi Sanksi */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Rekomendasi Sanksi *</label>
                  <textarea 
                    rows={2}
                    value={editSanctionForm.rekomendasiSanksi || ""}
                    onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, rekomendasiSanksi: e.target.value } : null)}
                    required
                    placeholder="Uraikan rekomendasi sanksi..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                  />
                </div>

                {/* Implementasi Sanksi */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Implementasi Sanksi</label>
                  <textarea 
                    rows={2}
                    value={editSanctionForm.implementasiSanksi || ""}
                    onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, implementasiSanksi: e.target.value } : null)}
                    placeholder="Uraikan realisasi pelaksanaan sanksi jika ada..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                  />
                </div>

                {/* Catatan Tambahan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Catatan Tambahan</label>
                  <textarea 
                    rows={2}
                    value={editSanctionForm.catatanTambahan || ""}
                    onChange={(e) => setEditSanctionForm(prev => prev ? { ...prev, catatanTambahan: e.target.value } : null)}
                    placeholder="Keterangan atau catatan tambahan..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-xs"
                  />
                </div>

                {/* Status Sanksi Selection Cards */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono">Status Sanksi *</label>
                  <div className="grid grid-cols-3 gap-4">
                    
                    <button 
                      type="button"
                      onClick={() => setEditSanctionForm(prev => prev ? { ...prev, statusSanksi: "Active" } : null)}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        editSanctionForm.statusSanksi === "Active"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
                      Active
                    </button>

                    <button 
                      type="button"
                      onClick={() => setEditSanctionForm(prev => prev ? { ...prev, statusSanksi: "Inactive" } : null)}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        editSanctionForm.statusSanksi === "Inactive"
                          ? "bg-slate-100 border-slate-500 text-slate-800 ring-2 ring-slate-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full mr-2"></span>
                      Inactive
                    </button>

                    <button 
                      type="button"
                      onClick={() => setEditSanctionForm(prev => prev ? { ...prev, statusSanksi: "Terminated" } : null)}
                      className={`flex items-center justify-center py-3.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        editSanctionForm.statusSanksi === "Terminated"
                          ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/10"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2"></span>
                      Terminated
                    </button>

                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex justify-end space-x-3 pt-4 border-t border-slate-100 flex-shrink-0">
                <button 
                  onClick={() => setSelectedSanction(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer transition-all"
                >
                  Batal
                </button>
                
                <button 
                  onClick={handleSaveSanctionUpdate}
                  disabled={updatingSanction}
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md hover:shadow-slate-800/10 transition-all inline-flex items-center"
                >
                  {updatingSanction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KONFIRMASI HAPUS REKOMENDASI SANKSI (Super User Only) */}
      <AnimatePresence>
        {confirmDeleteSanctionId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 overflow-hidden"
            >
              
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 mb-4 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Konfirmasi Hapus Sanksi
                </h3>
              </div>

              <div className="space-y-3.5">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data rekomendasi sanksi ini secara permanen dari database? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                </p>

                {(() => {
                  const sanctionToDel = sanctions.find(s => s.id === confirmDeleteSanctionId);
                  if (!sanctionToDel) return null;
                  return (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1.5 font-sans">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                        <span>NAMA PIC & LOKASI</span>
                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase text-[9px] font-extrabold tracking-wider">CONFIDENTIAL</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {sanctionToDel.namaPic} ({sanctionToDel.region} - {sanctionToDel.wilayah})
                      </p>
                      <div className="text-[10px] font-bold text-slate-400 font-mono pt-1">
                        REKOMENDASI SANKSI
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {sanctionToDel.rekomendasiSanksi}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setConfirmDeleteSanctionId(null)}
                  disabled={deletingSanction}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                
                <button 
                  onClick={() => confirmDeleteSanctionId !== null && handleDeleteSanction(confirmDeleteSanctionId)}
                  disabled={deletingSanction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md hover:shadow-rose-600/10 transition-all inline-flex items-center"
                >
                  {deletingSanction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Hapus Permanen</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
