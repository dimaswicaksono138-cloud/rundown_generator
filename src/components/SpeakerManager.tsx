import React, { useState, useEffect } from 'react';

interface SpeakerManagerProps {
  onClose: () => void;
}

export const DEFAULT_PERSONNEL = [
  'Ketua Kelompok',
  'Wakil Ketua',
  'Sekretaris',
  'Bendahara',
  'Koordinator Proker',
  'Sie Konsumsi',
  'Sie Dokumentasi',
  'Sie Humas',
  'Sie Perlengkapan',
  'Semua Anggota',
  'Anggota 1',
  'Anggota 2',
  'Anggota 3',
  'Anggota 4',
  'Anggota 5',
];

export const SpeakerManager: React.FC<SpeakerManagerProps> = ({ onClose }) => {
  const [personnel, setPersonnel] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('kkm_personnel');
    if (saved) {
      setPersonnel(JSON.parse(saved));
    } else {
      setPersonnel(DEFAULT_PERSONNEL);
      localStorage.setItem('kkm_personnel', JSON.stringify(DEFAULT_PERSONNEL));
    }
  }, []);

  const savePersonnel = (newList: string[]) => {
    setPersonnel(newList);
    localStorage.setItem('kkm_personnel', JSON.stringify(newList));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (personnel.includes(newName.trim())) {
      alert('Nama sudah ada dalam daftar!');
      return;
    }
    savePersonnel([...personnel, newName.trim()]);
    setNewName('');
  };

  const handleDelete = (index: number) => {
    if (confirm('Hapus anggota ini dari daftar?')) {
      savePersonnel(personnel.filter((_, idx) => idx !== index));
    }
  };

  const startEdit = (index: number) => {
    setEditingIdx(index);
    setEditName(personnel[index] || '');
  };

  const handleSaveEdit = (index: number) => {
    if (!editName.trim()) return;
    const updated = [...personnel];
    updated[index] = editName.trim();
    savePersonnel(updated);
    setEditingIdx(null);
  };

  const handleReset = () => {
    if (confirm('Kembalikan ke daftar anggota bawaan?')) {
      savePersonnel(DEFAULT_PERSONNEL);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <h2>👥 Kelola Anggota Kelompok KKM</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Daftar ini muncul sebagai opsi Penanggung Jawab (PJ) pada jadwal kegiatan.
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Tambah nama anggota / peran..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Tambah</button>
        </form>

        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.25rem' }}>
          {personnel.map((name, index) => (
            <div
              key={index}
              className="flex justify-between align-center"
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                marginBottom: '0.5rem'
              }}
            >
              {editingIdx === index ? (
                <div className="flex gap-2 flex-1" style={{ marginRight: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(index)}>
                    ✓
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '0.95rem' }}>{name}</span>
              )}
              <div className="flex gap-1">
                {editingIdx !== index && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={() => startEdit(index)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="btn btn-sm"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  onClick={() => handleDelete(index)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between align-center">
          <button className="btn btn-secondary" onClick={handleReset}>Reset Default</button>
          <button className="btn btn-primary" onClick={onClose}>Selesai</button>
        </div>
      </div>
    </div>
  );
};
