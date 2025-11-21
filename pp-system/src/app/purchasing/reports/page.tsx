// Halaman laporan pembelian
'use client';

import { useState } from 'react';

type ReportRow = {
  orderDate: string;
  poNumber: string;
  requestNumber: string;
  department: string;
  vendorName: string;
  totalAmount: number;
};

type ReportResponse = {
  from: string;
  to: string;
  count: number;
  totalAmount: number;
  rows: ReportRow[];
};

export default function PurchasingReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<ReportResponse | null>(null);

  async function fetchJson() {
    if (!from || !to) return;
    const res = await fetch(`/api/reports/purchases?from=${from}&to=${to}&format=json`);
    const data = await res.json();
    setReport(data);
  }

  function downloadExcel() {
    if (!from || !to) return;
    window.location.href = `/api/reports/purchases?from=${from}&to=${to}&format=excel`;
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Laporan Pembelian</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchJson}>Tampilkan JSON</button>
          <button onClick={downloadExcel}>Unduh Excel</button>
        </div>
      </div>

      {report && (
        <div style={{ marginTop: 24 }}>
          <div>Menampilkan {report.count} baris. Total: {report.totalAmount}</div>
          <table border={1} cellPadding={6} style={{ marginTop: 8, width: '100%', maxWidth: 900 }}>
            <thead>
              <tr>
                <th>Tgl Order</th>
                <th>No. PO</th>
                <th>No. PP</th>
                <th>Departemen</th>
                <th>Vendor</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.orderDate}</td>
                  <td>{r.poNumber}</td>
                  <td>{r.requestNumber}</td>
                  <td>{r.department}</td>
                  <td>{r.vendorName}</td>
                  <td>{r.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
