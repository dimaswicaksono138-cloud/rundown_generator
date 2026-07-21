import React, { useState } from 'react';
import { generateWeekSchedule } from '../utils/generator';
import type { KKMSchedule, Activity } from '../utils/generator';

interface ScheduleWizardProps {
  onClose: () => void;
  onSave: (schedule: KKMSchedule, activities: Activity[]) => void;
}

export const ScheduleWizard: React.FC<ScheduleWizardProps> = ({ onClose, onSave }) => {
  const [namaKelompok, setNamaKelompok] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState(() => {
    const today = new Date();
    // Default to next Monday
    const day = today.getDay();
    const diff = day === 0 ? 1 : (8 - day);
    const nextMon = new Date(today);
    nextMon.setDate(today.getDate() + diff);
    return nextMon.toISOString().split('T')[0] || '';
  });
  const [jumlahMinggu, setJumlahMinggu] = useState(1);
  const [includeRutin, setIncludeRutin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelompok || !lokasi || !tanggalMulai) {
      alert('Harap isi semua kolom yang wajib!');
      return;
    }

    const newSchedule: KKMSchedule = {
      id: `schedule-${Date.now()}`,
      namaKelompok,
      lokasi,
      tanggalMulai,
      jumlahMinggu,
      includeRutin,
    };

    const activities = generateWeekSchedule(newSchedule);
    onSave(newSchedule, activities);
  };

  // Calculate end date display
  const getEndDate = () => {
    if (!tanggalMulai) return '';
    const d = new Date(tanggalMulai);
    d.setDate(d.getDate() + (jumlahMinggu * 7) - 1);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="modal-header">
          <h2>📋 Buat Jadwal KKM Baru</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Atur jadwal kegiatan harian kelompok KKM Anda selama periode penempatan.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Kelompok KKM</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Kelompok 12 - KKM Desa Sukamaju"
              value={namaKelompok}
              onChange={(e) => setNamaKelompok(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Lokasi Posko / Desa</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Desa Sukamaju, Kec. Ciamis"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label>Tanggal Mulai KKM</label>
              <input
                type="date"
                className="form-control"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Jumlah Minggu</label>
              <div className="flex align-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={jumlahMinggu}
                  onChange={(e) => setJumlahMinggu(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                />
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: '800',
                  fontSize: '1.5rem',
                  color: 'var(--primary)',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {jumlahMinggu}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                = {jumlahMinggu * 7} hari kegiatan
              </p>
            </div>
          </div>

          {/* End date preview */}
          {tanggalMulai && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              background: 'rgba(99, 102, 241, 0.06)', 
              border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: 'var(--radius-sm)', 
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              📅 Periode: <strong style={{ color: 'var(--text-primary)' }}>
                {new Date(tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong> s/d <strong style={{ color: 'var(--text-primary)' }}>
                {getEndDate()}
              </strong>
            </div>
          )}

          {/* Include routine checkbox */}
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem'
          }}>
            <label className="flex align-center gap-2" style={{ cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal' }}>
              <input
                type="checkbox"
                checked={includeRutin}
                onChange={(e) => setIncludeRutin(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Sertakan kegiatan rutin bawaan
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Apel Pagi, Sholat, Makan, Rapat Evaluasi, dll. akan otomatis terisi di setiap hari.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-accent">
              Buat Jadwal KKM ✨
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
