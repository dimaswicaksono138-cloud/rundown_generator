import React from 'react';

export interface RowData {
  id: string;
  date: string;
  time: string;
  activity: string;
  pic: string;
}

interface Props {
  title: string;
  rows: RowData[];
}

export const PdfExportView: React.FC<Props> = ({ title, rows }) => {
  // Group by date to determine rowSpan
  const groupedRows: { [date: string]: RowData[] } = {};
  
  rows.forEach((row) => {
    if (!groupedRows[row.date]) {
      groupedRows[row.date] = [];
    }
    groupedRows[row.date].push(row);
  });

  return (
    <div id="pdf-content" style={{ padding: '40px', background: 'white', color: 'black', fontFamily: '"Times New Roman", Times, serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px', color: 'black', fontWeight: 'bold' }}>{title}</h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'yellow', fontWeight: 'bold' }}>No.</th>
            <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'yellow', fontWeight: 'bold' }}>Tanggal</th>
            <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'yellow', fontWeight: 'bold' }}>Waktu</th>
            <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'yellow', fontWeight: 'bold' }}>Kegiatan</th>
            <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'yellow', fontWeight: 'bold' }}>Penanggung Jawab</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedRows).map(([date, dateRows]) => {
            return dateRows.map((row, rowIndex) => {
              // Menghitung nomor urut global
              const globalRowIndex = rows.findIndex((r) => r.id === row.id) + 1;
              
              return (
                <tr key={row.id}>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{globalRowIndex}.</td>
                  
                  {/* Sel tanggal di-merge menggunakan rowSpan */}
                  {rowIndex === 0 && (
                    <td 
                      rowSpan={dateRows.length} 
                      style={{ border: '1px solid black', padding: '8px', verticalAlign: 'middle', whiteSpace: 'pre-wrap' }}
                    >
                      {date}
                    </td>
                  )}
                  
                  <td style={{ border: '1px solid black', padding: '8px' }}>{row.time}</td>
                  <td style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>{row.activity}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{row.pic}</td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
};
