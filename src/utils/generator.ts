// ==========================================
// KKM Weekly Schedule - Data Models & Generator
// ==========================================

export interface KKMSchedule {
  id: string;
  namaKelompok: string;
  lokasi: string;
  tanggalMulai: string;       // "YYYY-MM-DD"
  jumlahMinggu: number;        // 1–8
  includeRutin: boolean;       // whether to auto-fill routine activities
}

export interface Activity {
  id: string;
  scheduleId: string;
  hari: string;               // "Senin", "Selasa", ...
  mingguKe: number;            // 1, 2, 3, ...
  tanggal: string;             // "YYYY-MM-DD" specific date
  judul: string;
  mulai: string;               // "HH:MM"
  selesai: string;             // "HH:MM"
  durasi: number;              // minutes
  jenis: 'rutin' | 'proker';
  pj: string;
  keterangan: string;
}

// Day names in Indonesian
export const HARI_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

// Default routine activities template
export interface RoutineTemplate {
  judul: string;
  mulai: string;
  selesai: string;
  durasi: number;
  pj: string;
  keterangan: string;
}

export const DEFAULT_ROUTINE: RoutineTemplate[] = [
  { judul: 'Bangun & Sholat Subuh', mulai: '05:30', selesai: '06:00', durasi: 30, pj: 'Semua Anggota', keterangan: 'Sholat Subuh berjamaah.' },
  { judul: 'Apel Pagi & Briefing', mulai: '06:00', selesai: '06:30', durasi: 30, pj: 'Ketua Kelompok', keterangan: 'Pengarahan kegiatan hari ini.' },
  { judul: 'Sarapan Bersama', mulai: '06:30', selesai: '07:00', durasi: 30, pj: 'Sie Konsumsi', keterangan: 'Makan pagi bersama di posko.' },
  { judul: 'Kegiatan Proker Pagi', mulai: '07:00', selesai: '11:30', durasi: 270, pj: 'Koordinator Proker', keterangan: '— Tambahkan kegiatan proker pagi di sini —' },
  { judul: 'Istirahat & Sholat Dzuhur', mulai: '11:30', selesai: '12:30', durasi: 60, pj: 'Semua Anggota', keterangan: 'Sholat Dzuhur berjamaah dan istirahat siang.' },
  { judul: 'Kegiatan Proker Siang', mulai: '12:30', selesai: '15:00', durasi: 150, pj: 'Koordinator Proker', keterangan: '— Tambahkan kegiatan proker siang di sini —' },
  { judul: 'Sholat Ashar & Istirahat', mulai: '15:00', selesai: '15:30', durasi: 30, pj: 'Semua Anggota', keterangan: 'Sholat Ashar berjamaah.' },
  { judul: 'Kegiatan Proker Sore', mulai: '15:30', selesai: '17:00', durasi: 90, pj: 'Koordinator Proker', keterangan: '— Tambahkan kegiatan proker sore di sini —' },
  { judul: 'Persiapan & Sholat Maghrib', mulai: '17:00', selesai: '17:30', durasi: 30, pj: 'Semua Anggota', keterangan: 'Mandi sore, persiapan sholat Maghrib.' },
  { judul: 'Makan Malam', mulai: '17:30', selesai: '18:30', durasi: 60, pj: 'Sie Konsumsi', keterangan: 'Makan malam bersama di posko.' },
  { judul: 'Sholat Isya & Rapat Evaluasi', mulai: '19:00', selesai: '20:00', durasi: 60, pj: 'Ketua Kelompok', keterangan: 'Evaluasi kegiatan hari ini dan rencana besok.' },
  { judul: 'Waktu Pribadi & Istirahat', mulai: '20:00', selesai: '22:00', durasi: 120, pj: 'Semua Anggota', keterangan: 'Waktu luang, persiapan tidur.' },
];

// Helper: convert "HH:MM" to total minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Helper: convert total minutes to "HH:MM"
export function minutesToTime(minutes: number): string {
  const normalizedMins = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalizedMins / 60);
  const m = normalizedMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Helper: add days to a date string
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

// Helper: get day-of-week name for a date
function getDayName(dateStr: string): string {
  const d = new Date(dateStr);
  const dayIndex = d.getDay(); // 0=Sun, 1=Mon, ...
  // Convert to our HARI_NAMES array (Mon=0, ..., Sun=6)
  const mapped = dayIndex === 0 ? 6 : dayIndex - 1;
  return HARI_NAMES[mapped]!;
}

// Format date as Indonesian locale string
export function formatTanggal(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Format short date
export function formatTanggalShort(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

// Generate the full weekly schedule
export function generateWeekSchedule(schedule: KKMSchedule): Activity[] {
  const activities: Activity[] = [];
  const totalDays = schedule.jumlahMinggu * 7;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const tanggal = addDays(schedule.tanggalMulai, dayOffset);
    const hari = getDayName(tanggal);
    const mingguKe = Math.floor(dayOffset / 7) + 1;

    if (schedule.includeRutin) {
      DEFAULT_ROUTINE.forEach((routine, idx) => {
        activities.push({
          id: `${schedule.id}-w${mingguKe}-d${dayOffset}-r${idx}-${Date.now() + idx}`,
          scheduleId: schedule.id,
          hari,
          mingguKe,
          tanggal,
          judul: routine.judul,
          mulai: routine.mulai,
          selesai: routine.selesai,
          durasi: routine.durasi,
          jenis: routine.judul.startsWith('Kegiatan Proker') ? 'proker' : 'rutin',
          pj: routine.pj,
          keterangan: routine.keterangan,
        });
      });
    }
  }

  return activities;
}

// Recalculate a day's activity times sequentially
export function recalculateDayActivities(activities: Activity[]): Activity[] {
  const sorted = [...activities].sort((a, b) => timeToMinutes(a.mulai) - timeToMinutes(b.mulai));
  let currentMins = sorted.length > 0 ? timeToMinutes(sorted[0]!.mulai) : 0;
  
  return sorted.map(act => {
    const start = currentMins;
    const end = start + act.durasi;
    currentMins = end;
    return {
      ...act,
      mulai: minutesToTime(start),
      selesai: minutesToTime(end),
    };
  });
}
