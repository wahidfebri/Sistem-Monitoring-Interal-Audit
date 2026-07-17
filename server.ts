import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { generateAuditData, generateSanctionData } from "./src/data";
import { AuditItem, SanctionItem } from "./src/types";

dotenv.config();

const DATA_FILE = path.join(process.cwd(), "audit_data.json");
const SANCTION_DATA_FILE = path.join(process.cwd(), "sanction_data.json");

// Helper function to normalize any date string format to DD/MM/YYYY (Tanggal/Bulan/Tahun)
function normalizeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const cleanStr = String(dateStr).trim();
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

  // Try Javascript Date parsing
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return cleanStr;
}

// Helper function to load audit items from file or fallback to initial data
function loadAuditData(): AuditItem[] {
  let items: AuditItem[] = [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      items = JSON.parse(content);
    } else {
      items = generateAuditData();
    }
  } catch (err) {
    console.error("Error loading audit data:", err);
    items = generateAuditData();
  }

  // Normalize dates for all items
  let hasChanges = false;
  const normalized = items.map(item => {
    const normStart = normalizeDate(item.periodeAwal);
    const normEnd = normalizeDate(item.periodeAkhir);
    if (item.periodeAwal !== normStart || item.periodeAkhir !== normEnd) {
      hasChanges = true;
    }
    return {
      ...item,
      periodeAwal: normStart,
      periodeAkhir: normEnd
    };
  });

  if (hasChanges) {
    saveAuditData(normalized);
  }

  return normalized;
}

// Helper function to save audit items to file
function saveAuditData(data: AuditItem[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving audit data:", err);
  }
}

// Helper functions for sanctions data
function loadSanctionData(): SanctionItem[] {
  let items: SanctionItem[] = [];
  try {
    if (fs.existsSync(SANCTION_DATA_FILE)) {
      const content = fs.readFileSync(SANCTION_DATA_FILE, "utf-8");
      items = JSON.parse(content);
    } else {
      items = generateSanctionData();
    }
  } catch (err) {
    console.error("Error loading sanction data:", err);
    items = generateSanctionData();
  }

  // Normalize dates for all items
  let hasChanges = false;
  const normalized = items.map(item => {
    const normStart = normalizeDate(item.periodeAwal);
    const normEnd = normalizeDate(item.periodeAkhir);
    if (item.periodeAwal !== normStart || item.periodeAkhir !== normEnd) {
      hasChanges = true;
    }
    return {
      ...item,
      periodeAwal: normStart,
      periodeAkhir: normEnd
    };
  });

  if (hasChanges) {
    saveSanctionData(normalized);
  }

  return normalized;
}

function saveSanctionData(data: SanctionItem[]) {
  try {
    fs.writeFileSync(SANCTION_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving sanction data:", err);
  }
}

// Initialize our mock database using the file-backed persistence
let auditDb: AuditItem[] = loadAuditData();
let sanctionDb: SanctionItem[] = loadSanctionData();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Endpoints

// Get all audit items
app.get("/api/audits", (req, res) => {
  res.json(auditDb);
});

// Add a single audit item (Manual input)
app.post("/api/audits", (req, res) => {
  const newItem: AuditItem = req.body;
  if (!newItem.region || !newItem.wilayah || !newItem.jenis || !newItem.temuan || !newItem.kondisi || !newItem.auditor || !newItem.periodeAwal || !newItem.periodeAkhir) {
    return res.status(400).json({ error: "Invalid audit data" });
  }
  // Normalize the dates
  newItem.periodeAwal = normalizeDate(newItem.periodeAwal);
  newItem.periodeAkhir = normalizeDate(newItem.periodeAkhir);

  // Generate random/sequential ID if not provided
  if (!newItem.id) {
    const maxId = auditDb.reduce((max, item) => typeof item.id === "number" ? Math.max(max, item.id) : max, 0);
    newItem.id = maxId + 1;
  }
  auditDb.unshift(newItem);
  saveAuditData(auditDb);
  res.status(201).json(newItem);
});

// Add bulk audit items (Excel upload)
app.post("/api/audits/bulk", (req, res) => {
  const newItems: AuditItem[] = req.body;
  if (!Array.isArray(newItems)) {
    return res.status(400).json({ error: "Data must be an array" });
  }

  let maxId = auditDb.reduce((max, item) => typeof item.id === "number" ? Math.max(max, item.id) : max, 0);
  
  const formattedItems = newItems.map((item, idx) => {
    return {
      ...item,
      id: item.id || (maxId + idx + 1),
      periodeAwal: normalizeDate(item.periodeAwal),
      periodeAkhir: normalizeDate(item.periodeAkhir),
      status: item.status || "On Progress"
    };
  });

  auditDb = [...formattedItems, ...auditDb];
  saveAuditData(auditDb);
  res.status(201).json({ count: formattedItems.length, items: formattedItems });
});

// Update single audit item (Kelola/Edit)
app.put("/api/audits/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  
  const parsedId = isNaN(Number(id)) ? id : Number(id);
  const auditIndex = auditDb.findIndex(a => a.id === parsedId);
  
  if (auditIndex === -1) {
    return res.status(404).json({ error: "Audit item not found" });
  }
  
  auditDb[auditIndex] = {
    ...auditDb[auditIndex],
    ...updatedData,
    periodeAwal: normalizeDate(updatedData.periodeAwal),
    periodeAkhir: normalizeDate(updatedData.periodeAkhir),
    id: parsedId
  };
  
  saveAuditData(auditDb);
  res.json(auditDb[auditIndex]);
});

// Delete single audit item (Hapus)
app.delete("/api/audits/:id", (req, res) => {
  const { id } = req.params;
  const parsedId = isNaN(Number(id)) ? id : Number(id);
  
  const initialLength = auditDb.length;
  auditDb = auditDb.filter(a => a.id !== parsedId);
  
  if (auditDb.length === initialLength) {
    return res.status(404).json({ error: "Audit item not found" });
  }
  
  saveAuditData(auditDb);
  res.json({ success: true, message: "Audit item deleted successfully" });
});

// Get all sanction items
app.get("/api/sanctions", (req, res) => {
  res.json(sanctionDb);
});

// Add a single sanction item (Manual input)
app.post("/api/sanctions", (req, res) => {
  const newItem: SanctionItem = req.body;
  if (!newItem.region || !newItem.wilayah || !newItem.namaPic || !newItem.jenisTemuan || !newItem.rekomendasiSanksi || !newItem.auditor || !newItem.periodeAwal || !newItem.periodeAkhir) {
    return res.status(400).json({ error: "Invalid sanction data" });
  }
  // Normalize the dates
  newItem.periodeAwal = normalizeDate(newItem.periodeAwal);
  newItem.periodeAkhir = normalizeDate(newItem.periodeAkhir);

  // Generate ID if not provided
  if (!newItem.id) {
    const maxId = sanctionDb.reduce((max, item) => typeof item.id === "number" ? Math.max(max, item.id) : max, 0);
    newItem.id = maxId + 1;
  }
  sanctionDb.unshift(newItem);
  saveSanctionData(sanctionDb);
  res.status(201).json(newItem);
});

// Add bulk sanction items (Excel upload)
app.post("/api/sanctions/bulk", (req, res) => {
  const newItems: SanctionItem[] = req.body;
  if (!Array.isArray(newItems)) {
    return res.status(400).json({ error: "Data must be an array" });
  }

  let maxId = sanctionDb.reduce((max, item) => typeof item.id === "number" ? Math.max(max, item.id) : max, 0);
  
  const formattedItems = newItems.map((item, idx) => {
    let finalStatus = item.statusSanksi || "Active";
    const norm = String(finalStatus).trim().toLowerCase();
    if (norm === "selesai" || norm === "terminated") finalStatus = "Terminated";
    else if (norm === "on progress" || norm === "active") finalStatus = "Active";
    else if (norm === "void" || norm === "inactive") finalStatus = "Inactive";
    else finalStatus = "Active";

    return {
      ...item,
      id: item.id || (maxId + idx + 1),
      periodeAwal: normalizeDate(item.periodeAwal),
      periodeAkhir: normalizeDate(item.periodeAkhir),
      statusSanksi: finalStatus as any
    };
  });

  sanctionDb = [...formattedItems, ...sanctionDb];
  saveSanctionData(sanctionDb);
  res.status(201).json({ count: formattedItems.length, items: formattedItems });
});

// Update single sanction item (Kelola/Edit)
app.put("/api/sanctions/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  
  const parsedId = isNaN(Number(id)) ? id : Number(id);
  const sanctionIndex = sanctionDb.findIndex(s => s.id === parsedId);
  
  if (sanctionIndex === -1) {
    return res.status(404).json({ error: "Sanction item not found" });
  }
  
  sanctionDb[sanctionIndex] = {
    ...sanctionDb[sanctionIndex],
    ...updatedData,
    periodeAwal: normalizeDate(updatedData.periodeAwal),
    periodeAkhir: normalizeDate(updatedData.periodeAkhir),
    id: parsedId
  };
  
  saveSanctionData(sanctionDb);
  res.json(sanctionDb[sanctionIndex]);
});

// Delete single sanction item (Hapus)
app.delete("/api/sanctions/:id", (req, res) => {
  const { id } = req.params;
  const parsedId = isNaN(Number(id)) ? id : Number(id);
  
  const initialLength = sanctionDb.length;
  sanctionDb = sanctionDb.filter(s => s.id !== parsedId);
  
  if (sanctionDb.length === initialLength) {
    return res.status(404).json({ error: "Sanction item not found" });
  }
  
  saveSanctionData(sanctionDb);
  res.json({ success: true, message: "Sanction item deleted successfully" });
});

// Vite middleware setup for full-stack integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SIAMS server running on http://localhost:${PORT}`);
  });
}

startServer();
