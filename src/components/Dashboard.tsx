import React, { useState } from 'react';
import type { KKMSchedule, Activity } from '../utils/generator';
import { formatTanggal } from '../utils/generator';

interface DashboardProps {
  schedules: KKMSchedule[];
  activities: Activity[];
  onSelectSchedule: (scheduleId: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onOpenWizard: () => void;
  onOpenPersonnel: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  schedules,
  activities,
  onSelectSchedule,
  onDeleteSchedule,
  onOpenWizard,
  onOpenPersonnel,
}) => {
  const [search, setSearch] = useState('');

  const filteredSchedules = schedules.filter(s =>
    s.namaKelompok.toLowerCase().includes(search.toLowerCase()) ||
    s.lokasi.toLowerCase().includes(search.toLowerCase())
  );

  const getActivityCount = (scheduleId: string) =>
    activities.filter(a => a.scheduleId === scheduleId).length;

  const getProkerCount = (scheduleId: string) =>
    activities.filter(a => a.scheduleId === scheduleId && a.jenis === 'proker').length;

  const getEndDate = (schedule: KKMSchedule) => {
    const d = new Date(schedule.tanggalMulai);
    d.setDate(d.getDate() + (schedule.jumlahMinggu * 7) - 1);
    return formatTanggal(d.toISOString().split('T')[0]!);
  };

  return (
    <div>
      {/* Hero */}
      <header className="hero-section">
        <h1 className="title-gradient">KKM Rundown Flow</h1>
        <p>Susun jadwal kegiatan harian kelompok KKM dalam satu minggu atau lebih — mudah, cepat, dan rapi.</p>

        <div className="flex justify-center gap-2" style={{ marginTop: '2rem' }}>
          <button className="btn btn-primary" onClick={onOpenWizard}>
            + Buat Jadwal KKM Baru
          </button>
          <button className="btn btn-secondary" onClick={onOpenPersonnel}>
            👥 Kelola Anggota
          </button>
        </div>
      </header>

      {/* Search */}
      {schedules.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', background: 'rgba(22, 25, 41, 0.4)' }}>
          <div className="search-wrapper">
            <span className="icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari nama kelompok atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Schedule Cards */}
      {filteredSchedules.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '4rem 2rem',
            background: 'rgba(22, 25, 41, 0.25)',
            borderStyle: 'dashed',
            borderColor: 'rgba(255,255,255,0.1)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h3>Belum Ada Jadwal KKM</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
            {search
              ? 'Tidak ada jadwal yang cocok dengan pencarian Anda.'
              : 'Buat jadwal kegiatan harian kelompok KKM Anda. Kegiatan rutin harian akan otomatis terisi, lalu Anda tinggal menambahkan program kerja di setiap hari.'}
          </p>
          {search ? (
            <button className="btn btn-secondary" onClick={() => setSearch('')}>
              Reset Pencarian
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onOpenWizard}>
              Buat Jadwal Pertama Anda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredSchedules.map((schedule) => (
            <div key={schedule.id} className="card flex flex-col justify-between" style={{ minHeight: '220px' }}>
              <div>
                <div className="flex justify-between align-center flex-wrap gap-1" style={{ marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{schedule.jumlahMinggu} Minggu</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {getActivityCount(schedule.id)} kegiatan
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {schedule.namaKelompok}
                </h3>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  📍 {schedule.lokasi}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  📅 {formatTanggal(schedule.tanggalMulai)}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  s/d {getEndDate(schedule)}
                </div>
              </div>

              {/* Stats */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div className="flex justify-between align-center">
                  <div className="flex gap-2">
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      🟢 {getProkerCount(schedule.id)} Proker
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.1)' }}
                      onClick={(e) => { e.stopPropagation(); onDeleteSchedule(schedule.id); }}
                    >
                      Hapus
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onSelectSchedule(schedule.id)}
                    >
                      Buka Jadwal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
