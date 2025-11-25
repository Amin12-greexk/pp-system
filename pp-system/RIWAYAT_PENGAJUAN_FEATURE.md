# Riwayat Pengajuan Pembelian - Feature Documentation

## Date: 2025-11-25

---

## ✅ Feature Overview

Halaman **Riwayat Pengajuan Pembelian** adalah fitur baru untuk purchasing department yang memungkinkan tracking semua pengajuan pembelian yang sudah diproses dengan status:
- ✅ **APPROVED** (Disetujui)
- ⟳ **NEEDS_REVISION** (Perlu Revisi)
- ✗ **REJECTED** (Ditolak)

---

## 📁 Files Created/Modified

### New Files:
1. **`src/app/purchasing/riwayat/page.tsx`** - Main history page
2. **`RIWAYAT_PENGAJUAN_FEATURE.md`** - This documentation

### Modified Files:
1. **`src/components/Sidebar.tsx`** - Added "Riwayat Pengajuan" menu
2. **`src/app/page.tsx`** - Added "Riwayat Pengajuan" to dashboard cards
3. **`src/app/api/requests/route.ts`** - Enhanced to include approver details

---

## 🎨 Features Implemented

### 1. Statistics Dashboard
Display real-time statistics:
- 📊 **Total Riwayat**: Total semua pengajuan yang sudah diproses
- ✓ **Disetujui**: Jumlah pengajuan yang disetujui
- ⟳ **Perlu Revisi**: Jumlah pengajuan yang perlu revisi
- ✗ **Ditolak**: Jumlah pengajuan yang ditolak

**Visual**: 4 stat cards dengan icon dan warna berbeda (blue, green, yellow, red)

### 2. Advanced Filtering
- **Search Bar**: Cari berdasarkan nomor PP, nama pemohon, atau departemen
- **Status Filter**: Filter by status (ALL, APPROVED, NEEDS_REVISION, REJECTED)
- Real-time filtering tanpa reload page

### 3. Request List View
Menampilkan list pengajuan dengan informasi:
- Nomor pengajuan (PP-YYYY-XXXX)
- Status badge dengan warna (hijau/kuning/merah)
- Nama pemohon
- Departemen
- Total estimasi
- Tanggal dibuat
- **Timeline approval** dengan visual flow

### 4. Approval Timeline
Setiap pengajuan menampilkan approval flow:
- Nama approver
- Role approver (MANAGER, DIRECTOR, PURCHASING)
- Status approval (✓ Disetujui, ✗ Ditolak, ⟳ Direvisi, ○ Menunggu)
- Catatan dari approver
- Visual flow dengan arrow (→)

### 5. Detail Modal
Klik pada pengajuan akan menampilkan modal detail:
- Full information pengajuan
- Complete approval history
- Approver notes
- Timestamp approval
- Link ke PDF
- Close button

---

## 🎯 User Flow

### Accessing History Page:
1. Login as purchasing user
2. Navigate to "Riwayat Pengajuan" from:
   - Sidebar menu (📜 icon)
   - Dashboard card
3. View all processed requests

### Filtering Data:
1. Use search bar to find specific request
2. Select status filter to see specific status
3. Results update in real-time

### Viewing Details:
1. Click on any request card
2. Modal opens with full details
3. View approval timeline and notes
4. Download PDF if needed
5. Close modal

---

## 📊 Data Structure

### PurchaseRequest Type:
```typescript
type PurchaseRequest = {
  id: number;
  number: string;
  status: string;
  totalEstimatedAmount: number | null;
  totalFinalAmount: number | null;
  createdAt: string;
  updatedAt: string;
  requester: { name: string };
  department: { name: string };
  approvals: Approval[];
  chosenVendor: { name: string } | null;
}
```

### Approval Type:
```typescript
type Approval = {
  id: number;
  level: number;
  role: string;
  status: string;
  approver: { name: string };
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
}
```

---

## 🎨 Design Elements

### Color Scheme:
- **APPROVED**: Green (bg-green-100, text-green-800, border-green-300)
- **NEEDS_REVISION**: Yellow (bg-yellow-100, text-yellow-800, border-yellow-300)
- **REJECTED**: Red (bg-red-100, text-red-800, border-red-300)

### Icons:
- ✓ Disetujui (Approved)
- ⟳ Perlu Revisi (Needs Revision)
- ✗ Ditolak (Rejected)
- 📜 Menu icon (Scroll)

### Layout:
- Gradient background: from-gray-50 via-blue-50 to-indigo-50
- Card-based design with shadows
- Responsive grid layout
- Hover effects on cards

---

## 🔧 API Integration

### Endpoint Used:
**GET** `/api/requests?includeApprovals=true`

### Response Enhanced:
API now includes approver details:
```json
{
  "approvals": [
    {
      "id": 1,
      "level": 1,
      "role": "MANAGER",
      "status": "APPROVED",
      "approver": {
        "name": "Manager Test"
      },
      "note": "Approved",
      "decidedAt": "2025-11-25T10:30:00Z"
    }
  ]
}
```

**Changes to API** (src/app/api/requests/route.ts:34-45):
- Added nested include for approver name
- Added orderBy for approval level
- Ensures chronological approval flow

---

## 🚀 Menu Integration

### Sidebar Menu (PURCHASING Role):
```
🏠 Dashboard
🏢 Vendor
📋 Permintaan & PO
📜 Riwayat Pengajuan ← NEW
📊 Laporan
```

### Dashboard Cards (PURCHASING Role):
```
[Vendor] [Permintaan & PO] [Riwayat Pengajuan] [Laporan]
                              ↑ NEW CARD
```

### Also Added to ADMIN Role:
Admin has full access to all purchasing features including history.

---

## 📱 Responsive Design

### Desktop (≥768px):
- 4 stat cards in row
- 2-column search/filter layout
- Full approval timeline visible
- Large modal

### Mobile (<768px):
- Stat cards stack vertically
- Search/filter stack
- Approval timeline scrollable
- Modal full screen

---

## 🧪 Testing Guide

### Test Case 1: View History
1. Login as purchasing: `purchasing@example.com` / `Password123`
2. Click "Riwayat Pengajuan" in sidebar
3. **Expected**: See all APPROVED, NEEDS_REVISION, REJECTED requests

### Test Case 2: Filter by Status
1. On history page, select "Disetujui" from filter
2. **Expected**: Only approved requests shown

### Test Case 3: Search Functionality
1. Type request number in search bar
2. **Expected**: Matching requests appear
3. Clear search
4. Type requester name
5. **Expected**: Requests from that requester shown

### Test Case 4: View Detail Modal
1. Click on any request card
2. **Expected**: Modal opens with full details
3. **Verify**: Approval timeline shows all approvers
4. **Verify**: Notes are displayed
5. Click "Tutup" button
6. **Expected**: Modal closes

### Test Case 5: Approval Timeline
1. Find request with multiple approvals
2. **Expected**: See flow: Approver1 → Approver2 → Approver3
3. **Verify**: Each approval shows status icon
4. **Verify**: Notes are visible if present

---

## 💡 Usage Examples

### For Purchasing Staff:
- **Daily**: Check all new approved requests
- **Review**: See why requests were rejected/revised
- **Follow-up**: Track requests needing revision
- **Report**: Export data for monthly reports

### For Purchasing Manager:
- **Audit**: Review approval history
- **Quality**: Check approval notes
- **Performance**: Monitor approval times

---

## 🔒 Access Control

### Who Can Access:
- ✅ **PURCHASING** role (full access)
- ✅ **ADMIN** role (full access)
- ❌ **EMPLOYEE** role (no access)
- ❌ **MANAGER** role (no access)
- ❌ **DIRECTOR** role (no access)
- ❌ **FINANCE** role (no access)

**Route**: `/purchasing/riwayat`

Protected by middleware (src/middleware.ts)

---

## 📈 Future Enhancements (Not Yet Implemented)

Potential improvements:
1. Export to Excel/CSV
2. Date range filter
3. Department filter
4. Vendor filter
5. Amount range filter
6. Sorting options (by date, amount, status)
7. Pagination for large datasets
8. Print view
9. Bulk actions
10. Email notifications

---

## ✅ Completed Checklist

- [x] Create riwayat page component
- [x] Add statistics cards
- [x] Implement search functionality
- [x] Implement status filter
- [x] Display approval timeline
- [x] Create detail modal
- [x] Add to sidebar menu
- [x] Add to dashboard cards
- [x] Update API to include approver details
- [x] Test TypeScript compilation
- [x] Create documentation

---

## 🎯 Status

**✅ FULLY IMPLEMENTED & READY FOR USE**

Feature riwayat pengajuan sudah siap digunakan oleh purchasing department untuk tracking semua pengajuan yang sudah diproses dengan detail approval history yang lengkap!

---

## 📸 UI Preview

### Stats Cards:
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 📊 Total    │ │ ✓ Disetujui │ │ ⟳ Revisi    │ │ ✗ Ditolak   │
│ Riwayat     │ │             │ │             │ │             │
│    125      │ │     98      │ │     15      │ │     12      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Request Card:
```
┌────────────────────────────────────────────────────────────┐
│ PP-2025-0001                          [✓ Disetujui]        │
│                                                             │
│ Pemohon: Employee Test      Departemen: IT                 │
│ Total: Rp 5,000,000         Tanggal: 24 Nov 2025          │
│                                                             │
│ Riwayat Approval:                                          │
│ Manager → ✓ Director → ✓ Purchasing → ✓                   │
│                                       [Lihat Detail →]      │
└────────────────────────────────────────────────────────────┘
```

### Detail Modal:
```
┌──────────────────────────────────────────────────────────┐
│ PP-2025-0001                     [✓ Disetujui]      [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Pemohon: Employee Test          Departemen: IT          │
│ Total: Rp 5,000,000             Vendor: PT ABC          │
│                                                          │
│ ─────────── Detail Approval ────────────                │
│                                                          │
│ ┌────────────────────────────────────────────┐          │
│ │ ✓ Manager Test - MANAGER                   │          │
│ │   Disetujui                                │          │
│ │   Catatan: "Approved for processing"       │          │
│ │   Diproses: 24 Nov 2025, 10:30             │          │
│ └────────────────────────────────────────────┘          │
│                                                          │
│              [Lihat PDF]  [Tutup]                        │
└──────────────────────────────────────────────────────────┘
```
