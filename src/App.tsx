import { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { PdfExportView, type RowData } from './components/PdfExportView';

function App() {
  const [rows, setRows] = useState<RowData[]>([]);
  const [title, setTitle] = useState('Rundown Acara Tanggal 20 Juli 2026');
  
  // Form states
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [activity, setActivity] = useState('');
  const [pic, setPic] = useState('');
  
  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('rundown_rows_v2');
    if (saved) setRows(JSON.parse(saved));
    const savedTitle = localStorage.getItem('rundown_title_v2');
    if (savedTitle) setTitle(savedTitle);
  }, []);
  
  const saveRows = (newRows: RowData[]) => {
    setRows(newRows);
    localStorage.setItem('rundown_rows_v2', JSON.stringify(newRows));
  };

  const saveTitle = (newTitle: string) => {
    setTitle(newTitle);
    localStorage.setItem('rundown_title_v2', newTitle);
  };
  
  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !activity || !pic) {
      alert('Lengkapi semua field!');
      return;
    }
    
    const newRow: RowData = {
      id: Date.now().toString(),
      date,
      time,
      activity,
      pic
    };
    saveRows([...rows, newRow]);
    
    // Clear inputs except date to speed up entering multiple activities for the same date
    setTime('');
    setActivity('');
    setPic('');
  };
  
  const handleDeleteRow = (id: string) => {
    saveRows(rows.filter((r) => r.id !== id));
  };
  
  const handleExportPDF = () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `${title}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };
  
  return (
    <div className="app-container">
      <header className="hero-section">
         <h1 className="title-gradient">Rundown Generator</h1>
         <p>Buat dan ekspor rundown acara Anda ke format PDF dengan mudah dan rapi.</p>
      </header>

      <div className="dashboard-grid">
        {/* Form Input Container */}
        <div className="card form-container">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Tambah Kegiatan</h2>
          
          <div className="form-group">
            <label>Judul Dokumen PDF</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Contoh: Rundwon Acara Tanggal 20 Juli 2026" 
              value={title} 
              onChange={(e) => saveTitle(e.target.value)} 
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

          <form onSubmit={handleAddRow}>
            <div className="form-group">
              <label>Tanggal</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Contoh: 20 Juli 2026" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Waktu</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Contoh: 08.30-08.45" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Kegiatan</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Contoh: Persiapan" 
                value={activity} 
                onChange={(e) => setActivity(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Penanggung Jawab (PIC)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Contoh: All / Bidang Tata Kelola" 
                value={pic} 
                onChange={(e) => setPic(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>
              + Tambah ke Daftar
            </button>
          </form>
        </div>

        {/* List & PDF Export Container */}
        <div className="card table-container-wrapper">
           <div className="flex justify-between align-center wrap-mobile" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
             <h2 style={{ color: 'var(--secondary)' }}>Daftar Kegiatan</h2>
             <button onClick={handleExportPDF} className="btn btn-accent" disabled={rows.length === 0}>
               📄 Export ke PDF
             </button>
           </div>
           


           {rows.length === 0 ? (
             <div className="empty-state">
               <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📝</span>
               Belum ada data kegiatan.<br/>Silakan tambahkan kegiatan melalui form di sebelah kiri.
             </div>
           ) : (
             <div className="table-responsive">
               <table className="rundown-table">
                 <thead>
                   <tr>
                     <th>Tanggal</th>
                     <th>Waktu</th>
                     <th>Kegiatan</th>
                     <th>PIC</th>
                     <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                   </tr>
                 </thead>
                 <tbody>
                   {rows.map((row) => (
                     <tr key={row.id}>
                       <td data-label="Tanggal"><span className="badge badge-primary">{row.date}</span></td>
                       <td data-label="Waktu" style={{ fontWeight: 'bold' }}>{row.time}</td>
                       <td data-label="Kegiatan">{row.activity}</td>
                       <td data-label="PIC" style={{ color: 'var(--text-secondary)' }}>{row.pic}</td>
                       <td data-label="">
                         <button onClick={() => handleDeleteRow(row.id)} className="btn btn-danger btn-sm" title="Hapus">
                           🗑 Hapus
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      </div>

      {/* Komponen Hidden untuk Dirender ke PDF (Off-Screen) */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
        <PdfExportView title={title} rows={rows} />
      </div>
    </div>
  );
}

export default App;
