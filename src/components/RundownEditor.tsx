import React, { useState, useEffect, useMemo, useRef } from 'react';
import { timeToMinutes, minutesToTime, HARI_NAMES, formatTanggalShort, formatTanggal } from '../utils/generator';
import type { KKMSchedule, Activity } from '../utils/generator';
import { exportToCSV, formatDayAsText, copyToClipboard } from '../utils/exporter';
import { DEFAULT_PERSONNEL } from './SpeakerManager';
import html2pdf from 'html2pdf.js';

interface WeeklyEditorProps {
  schedule: KKMSchedule;
  activities: Activity[];
  onSaveActivities: (scheduleId: string, activities: Activity[]) => void;
  onBack: () => void;
}

export const WeeklyEditor: React.FC<WeeklyEditorProps> = ({
  schedule,
  activities,
  onSaveActivities,
  onBack,
}) => {
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);
  const [personnelList, setPersonnelList] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0–6 within selected week
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  useEffect(() => {
    const saved = localStorage.getItem('kkm_personnel');
    setPersonnelList(saved ? JSON.parse(saved) : DEFAULT_PERSONNEL);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Build a list of all dates for the schedule
  const allDates = useMemo(() => {
    const dates: { tanggal: string; hari: string; mingguKe: number }[] = [];
    const totalDays = schedule.jumlahMinggu * 7;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(schedule.tanggalMulai);
      d.setDate(d.getDate() + i);
      const tanggal = d.toISOString().split('T')[0]!;
      const dayIdx = d.getDay();
      const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
      dates.push({ tanggal, hari: HARI_NAMES[mappedIdx]!, mingguKe: Math.floor(i / 7) + 1 });
    }
    return dates;
  }, [schedule]);

  // Current week dates
  const weekDates = allDates.filter(d => d.mingguKe === selectedWeek);

  // Current selected day
  const currentDay = weekDates[selectedDayIndex];

  // Activities for a specific date
  const getActivitiesForDate = (tanggal: string) =>
    localActivities.filter(a => a.tanggal === tanggal).sort((a, b) => a.mulai.localeCompare(b.mulai));

  // Activities for selected day
  const dayActivities = currentDay ? getActivitiesForDate(currentDay.tanggal) : [];

  const saveAll = (updated: Activity[]) => {
    setLocalActivities(updated);
    onSaveActivities(schedule.id, updated);
  };

  // Edit a field on a specific activity
  const handleFieldChange = (activityId: string, field: keyof Activity, value: any) => {
    const updated = localActivities.map(a => {
      if (a.id !== activityId) return a;
      return { ...a, [field]: value };
    });
    saveAll(updated);
  };

  // Reorder activities within a day
  const handleMove = (activityId: string, direction: 'up' | 'down') => {
    if (!currentDay) return;
    const dayActs = [...getActivitiesForDate(currentDay.tanggal)];
    const idx = dayActs.findIndex(a => a.id === activityId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= dayActs.length) return;

    // Swap
    const temp = dayActs[idx]!;
    dayActs[idx] = dayActs[targetIdx]!;
    dayActs[targetIdx] = temp;

    const otherActs = localActivities.filter(a => a.tanggal !== currentDay.tanggal);
    saveAll([...otherActs, ...dayActs]);
    showToast('Urutan kegiatan diubah!');
  };

  // Add new activity to current day
  const handleAddActivity = (jenis: 'rutin' | 'proker') => {
    if (!currentDay) return;
    const lastAct = dayActivities[dayActivities.length - 1];
    const startTime = lastAct ? lastAct.selesai : '07:00';
    const endTime = minutesToTime(timeToMinutes(startTime) + 60);

    const newAct: Activity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      scheduleId: schedule.id,
      hari: currentDay.hari,
      mingguKe: currentDay.mingguKe,
      tanggal: currentDay.tanggal,
      judul: jenis === 'proker' ? 'Program Kerja Baru' : 'Kegiatan Rutin Baru',
      mulai: startTime,
      selesai: endTime,
      durasi: 60, // kept for data model compatibility, but not used for calculation
      jenis,
      pj: personnelList[0] || 'Panitia KKM',
      keterangan: '',
    };

    const updated = [...localActivities, newAct];
    saveAll(updated);
    showToast(`Kegiatan ${jenis === 'proker' ? 'proker' : 'rutin'} ditambahkan!`);
  };

  // Delete activity
  const handleDelete = (activityId: string) => {
    if (!confirm('Hapus kegiatan ini?')) return;
    const updated = localActivities.filter(a => a.id !== activityId);
    saveAll(updated);
    showToast('Kegiatan dihapus.');
  };

  // Copy day schedule to WhatsApp
  const handleCopyDay = async () => {
    if (!currentDay) return;
    const text = formatDayAsText(schedule, dayActivities, currentDay.tanggal, currentDay.hari, currentDay.mingguKe);
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Jadwal hari ini disalin ke clipboard! 📋' : 'Gagal menyalin.');
  };

  // Export all as CSV
  const handleExportCSV = () => {
    exportToCSV(schedule, localActivities);
    showToast('File CSV berhasil diunduh! 📊');
  };

  // Export to PDF using html2pdf
  const handleExportPDF = () => {
    if (!pdfRef.current) return;
    const element = pdfRef.current;
    
    // Add a temporary class for PDF specific styles if needed
    element.classList.add('pdf-export-mode');
    
    const opt = {
      margin:       10,
      filename:     `Jadwal_KKM_${schedule.namaKelompok.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };

    showToast('Menyiapkan file PDF, mohon tunggu... ⏳');
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('pdf-export-mode');
      showToast('File PDF berhasil diunduh! 📄');
    });
  };

  // Stats
  const totalActivities = localActivities.length;
  const totalProker = localActivities.filter(a => a.jenis === 'proker').length;
  const totalRutin = totalActivities - totalProker;

  return (
    <div ref={pdfRef} style={{ background: 'var(--background)', padding: '1rem', minHeight: '100%' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          background: 'var(--primary-gradient)', color: 'white',
          padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)', zIndex: 1100,
          fontSize: '0.95rem', fontWeight: '500',
          animation: 'fadeIn var(--transition-fast) forwards'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Back button */}
      <div className="flex align-center gap-2 no-print" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>&larr; Dashboard</button>
      </div>

      {/* Schedule Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex justify-between align-center flex-wrap gap-2">
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
              {schedule.jumlahMinggu} Minggu
            </span>
            <h1 className="title-gradient" style={{ fontSize: '2rem' }}>{schedule.namaKelompok}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              📍 {schedule.lokasi} &nbsp;|&nbsp; 📅 {formatTanggal(schedule.tanggalMulai)} — {formatTanggal(
                (() => { const d = new Date(schedule.tanggalMulai); d.setDate(d.getDate() + schedule.jumlahMinggu * 7 - 1); return d.toISOString().split('T')[0]!; })()
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row no-print">
        <div className="stat-card">
          <div className="stat-value text-gradient-purple">{schedule.jumlahMinggu * 7}</div>
          <div className="stat-label">Hari</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-gradient-cyan">{totalActivities}</div>
          <div className="stat-label">Total Kegiatan</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#6366f1' }}>{totalRutin}</div>
          <div className="stat-label">🔵 Rutin</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{totalProker}</div>
          <div className="stat-label">🟢 Proker</div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="week-selector no-print">
        {Array.from({ length: schedule.jumlahMinggu }, (_, i) => i + 1).map(w => (
          <button
            key={w}
            className={`week-pill ${selectedWeek === w ? 'active' : ''}`}
            onClick={() => { setSelectedWeek(w); setSelectedDayIndex(0); }}
          >
            Minggu {w}
          </button>
        ))}
      </div>

      {/* View Toggle + Action Toolbar */}
      <div className="card flex justify-between align-center flex-wrap gap-2 no-print" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem 1rem' }}>
        <div className="flex gap-1">
          <button className={`btn btn-sm ${viewMode === 'weekly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('weekly')}>
            📅 Tabel Mingguan
          </button>
          <button className={`btn btn-sm ${viewMode === 'daily' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('daily')}>
            📝 Detail Harian
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {viewMode === 'daily' && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAddActivity('proker')}>🟢 + Proker</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAddActivity('rutin')}>🔵 + Rutin</button>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyDay}>📲 Salin WA</button>
            </>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>📊 Excel</button>
          <button className="btn btn-accent btn-sm" onClick={handleExportPDF}>📄 Unduh PDF</button>
        </div>
      </div>

      {/* ============ VIEW: WEEKLY OVERVIEW GRID ============ */}
      {viewMode === 'weekly' && (
        <div className="weekly-grid">
          {weekDates.map((day, dayIdx) => {
            const acts = getActivitiesForDate(day.tanggal);
            return (
              <div
                key={day.tanggal}
                className="weekly-day-card"
                onClick={() => { setSelectedDayIndex(dayIdx); setViewMode('daily'); }}
              >
                <div className="day-header">
                  {day.hari}
                  <span className="date-sub">{formatTanggalShort(day.tanggal)}</span>
                </div>
                {acts.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>Belum ada kegiatan</p>
                ) : (
                  acts.map(act => (
                    <div key={act.id} className={`mini-activity ${act.jenis === 'proker' ? 'proker' : ''}`}>
                      <span className="mini-time">{act.mulai}</span>
                      <span className="mini-title">{act.judul}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============ VIEW: DAILY DETAIL EDITOR ============ */}
      {viewMode === 'daily' && (
        <>
          {/* Day Tabs */}
          <div className="day-tabs">
            {weekDates.map((day, dayIdx) => {
              const count = getActivitiesForDate(day.tanggal).length;
              return (
                <button
                  key={day.tanggal}
                  className={`day-tab ${selectedDayIndex === dayIdx ? 'active' : ''}`}
                  onClick={() => setSelectedDayIndex(dayIdx)}
                >
                  <span className="day-name">{day.hari}</span>
                  <span className="day-date">{formatTanggalShort(day.tanggal)}</span>
                  <span className="day-count">{count} kegiatan</span>
                </button>
              );
            })}
          </div>

          {/* Day Header */}
          {currentDay && (
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem' }}>
                {currentDay.hari}, {formatTanggal(currentDay.tanggal)}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '0.75rem' }}>
                  Minggu ke-{currentDay.mingguKe}
                </span>
              </h2>
            </div>
          )}

          {/* Activities Table */}
          {dayActivities.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Belum ada kegiatan di hari ini.</p>
              <div className="flex justify-center gap-2">
                <button className="btn btn-primary btn-sm" onClick={() => handleAddActivity('proker')}>🟢 Tambah Proker</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAddActivity('rutin')}>🔵 Tambah Rutin</button>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="rundown-table">
                <thead>
                  <tr>
                    <th className="no-print" style={{ width: '40px', textAlign: 'center' }}>⬍</th>
                    <th style={{ width: '50px' }}>Jenis</th>
                    <th style={{ width: '130px' }}>Waktu</th>
                    <th>Kegiatan</th>
                    <th style={{ width: '140px' }}>PJ</th>
                    <th>Keterangan</th>
                    <th className="no-print" style={{ width: '40px' }}>✕</th>
                  </tr>
                </thead>
                <tbody>
                  {dayActivities.map((act, idx) => (
                    <tr key={act.id} className={act.jenis === 'proker' ? 'activity-type-proker' : 'activity-type-rutin'}>
                      {/* Reorder */}
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <div className="order-btn-group">
                          <button className="order-btn" disabled={idx === 0} onClick={() => handleMove(act.id, 'up')}>▲</button>
                          <button className="order-btn" disabled={idx === dayActivities.length - 1} onClick={() => handleMove(act.id, 'down')}>▼</button>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td>
                        <span className={`badge ${act.jenis === 'rutin' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                          {act.jenis === 'rutin' ? '🔵' : '🟢'}
                        </span>
                      </td>

                      {/* Time (manual input) */}
                      <td>
                        <div className="flex align-center gap-1 no-print">
                          <input
                            type="time"
                            className="form-control"
                            style={{ padding: '0.2rem', width: '60px', fontSize: '0.8rem' }}
                            value={act.mulai}
                            onChange={(e) => handleFieldChange(act.id, 'mulai', e.target.value)}
                          />
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                          <input
                            type="time"
                            className="form-control"
                            style={{ padding: '0.2rem', width: '60px', fontSize: '0.8rem' }}
                            value={act.selesai}
                            onChange={(e) => handleFieldChange(act.id, 'selesai', e.target.value)}
                          />
                        </div>
                        <span className="print-only" style={{ display: 'none', fontFamily: 'var(--font-family-heading)', fontWeight: '600', color: 'var(--secondary)' }}>
                          {act.mulai} – {act.selesai}
                        </span>
                      </td>

                      {/* Title (editable) */}
                      <td>
                        <input
                          type="text"
                          className="form-control no-print"
                          style={{ padding: '0.3rem 0.5rem' }}
                          value={act.judul}
                          onChange={(e) => handleFieldChange(act.id, 'judul', e.target.value)}
                        />
                        <span className="print-only" style={{ display: 'none', fontWeight: 500 }}>{act.judul}</span>
                      </td>

                      {/* PJ (dropdown) */}
                      <td>
                        <select
                          className="form-control no-print"
                          style={{ padding: '0.3rem' }}
                          value={act.pj}
                          onChange={(e) => handleFieldChange(act.id, 'pj', e.target.value)}
                        >
                          {/* Include current value if not in list */}
                          {!personnelList.includes(act.pj) && <option value={act.pj}>{act.pj}</option>}
                          {personnelList.map((name, pIdx) => (
                            <option key={pIdx} value={name}>{name}</option>
                          ))}
                        </select>
                        <span className="print-only" style={{ display: 'none' }}>{act.pj}</span>
                      </td>

                      {/* Notes (editable) */}
                      <td>
                        <input
                          type="text"
                          className="form-control no-print"
                          style={{ padding: '0.3rem 0.5rem' }}
                          placeholder="Keterangan..."
                          value={act.keterangan}
                          onChange={(e) => handleFieldChange(act.id, 'keterangan', e.target.value)}
                        />
                        <span className="print-only" style={{ display: 'none', fontSize: '0.85rem', color: '#666' }}>{act.keterangan}</span>
                      </td>

                      {/* Delete */}
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-sm"
                          style={{ padding: '0.2rem 0.4rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                          onClick={() => handleDelete(act.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Print overrides */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          input.form-control, select.form-control { display: none !important; }
          body { font-size: 12pt !important; background: white !important; color: black !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #999 !important; padding: 6px !important; }
        }
      `}</style>
    </div>
  );
};
