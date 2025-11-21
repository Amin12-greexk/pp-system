// npm install prisma @prisma/client xlsx exceljs
// In package.json add: "prisma": { "seed": "node prisma/seed.js" }

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, 'data', 'DATABASE HARGA BARANG.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['DATA BASE HARGA '];

  if (!sheet) {
    throw new Error('Sheet "DATA BASE HARGA " not found');
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const seen = new Set();
  const vendors = [];

  for (const row of rows) {
    const name = String(row['NAMA SUPPLIER '] || '').trim();
    const city = String(row['KOTA SUPPLIER'] || '').trim();
    const contactPerson = String(row['KONTAK SUPPLIER '] || '').trim();
    const bankAccount = String(row['NO. REKENING '] || '').trim();

    if (!name) continue;

    const key = [name, city, contactPerson, bankAccount].map((v) => v.toLowerCase()).join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    vendors.push({
      name,
      city: city || null,
      contactPerson: contactPerson || null,
      bankAccount: bankAccount || null,
      notes: 'Imported from DATABASE HARGA BARANG.xlsx',
    });
  }

  if (vendors.length > 0) {
    await prisma.vendor.createMany({
      data: vendors,
    });
  }

  // Basic departments and users for testing
  const depIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { name: 'IT', code: 'IT' },
  });
  const depFIN = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance', code: 'FIN' },
  });

  await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      name: 'Employee Test',
      email: 'employee@example.com',
      departmentId: depIT.id,
      role: 'EMPLOYEE',
    },
  });
  await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      name: 'Manager Test',
      email: 'manager@example.com',
      departmentId: depIT.id,
      role: 'MANAGER',
    },
  });
  await prisma.user.upsert({
    where: { email: 'purchasing@example.com' },
    update: {},
    create: {
      name: 'Purchasing Test',
      email: 'purchasing@example.com',
      departmentId: depFIN.id,
      role: 'PURCHASING',
    },
  });

  console.log(`Seed complete. Vendors inserted: ${vendors.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
