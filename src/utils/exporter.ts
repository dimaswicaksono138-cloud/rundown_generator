import type { KKMSchedule, Activity } from './generator';
import { HARI_NAMES, formatTanggal } from './generator';

// Export full schedule to CSV (Excel-friendly)
export function exportToCSV(schedule: KKMSchedule, activities: Activity[]) {
  const headers = ['Minggu Ke', 'Hari', 'Tanggal', 'Mulai', 'Selesai', 'Durasi (Menit)', 'Jenis', 'Judul Kegiatan', 'Penanggung Jawab', 'Keterangan'];

  const rows = activities
    .sort((a, b) => {
      if (a.mingguKe !== b.mingguKe) return a.mingguKe - b.mingguKe;
      const dayA = HARI_NAMES.indexOf(a.hari as any);
      const dayB = HARI_NAMES.indexOf(b.hari as any);
      if (dayA !== dayB) return dayA - dayB;
      return a.mulai.localeCompare(b.mulai);
    })
    .map(a => [
      a.mingguKe.toString(),
      a.hari,
      a.tanggal,
      a.mulai,
      a.selesai,
      a.durasi.toString(),
      a.jenis === 'rutin' ? 'Rutin' : 'Proker',
      `"${a.judul.replace(/"/g, '""')}"`,
      `"${a.pj.replace(/"/g, '""')}"`,
      `"${a.keterangan.replace(/"/g, '""')}"`
    ]);

  const csvContent = [
    `"JADWAL KEGIATAN KKM: ${schedule.namaKelompok.replace(/"/g, '""')}"`,
    `"Lokasi: ${schedule.lokasi}"`,
    `"Mulai: ${schedule.tanggalMulai}","Durasi: ${schedule.jumlahMinggu} Minggu"`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Jadwal_KKM_${schedule.namaKelompok.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Format a single day's activities as WhatsApp-friendly text
export function formatDayAsText(schedule: KKMSchedule, dayActivities: Activity[], tanggal: string, hari: string, mingguKe: number): string {
  let text = `*JADWAL KEGIATAN KKM*\n`;
  text += `📋 *${schedule.namaKelompok}*\n`;
  text += `📍 ${schedule.lokasi}\n`;
  text += `📅 ${hari}, ${formatTanggal(tanggal)} (Minggu ke-${mingguKe})\n`;
  text += `==========================================\n\n`;

  const sorted = [...dayActivities].sort((a, b) => a.mulai.localeCompare(b.mulai));

  sorted.forEach((a, idx) => {
    const icon = a.jenis === 'rutin' ? '🔵' : '🟢';
    text += `${icon} *${a.mulai} - ${a.selesai}* (${a.durasi} mnt)\n`;
    text += `     ${idx + 1}. *${a.judul}*\n`;
    text += `     👤 PJ: ${a.pj}\n`;
    if (a.keterangan && !a.keterangan.startsWith('—')) {
      text += `     📝 ${a.keterangan}\n`;
    }
    text += `\n`;
  });

  text += `==========================================\n`;
  text += `🔵 = Rutin | 🟢 = Program Kerja\n`;
  text += `_Dibuat via KKM Rundown Flow_`;

  return text;
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}
