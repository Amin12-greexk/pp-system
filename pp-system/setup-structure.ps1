# Jalankan script ini dari root project (di mana folder 'src' seharusnya dibuat)

# 1. Daftar folder yang mau dibuat
$directories = @(
    "src",
    "src/app",
    "src/app/api",
    "src/app/api/vendors",
    "src/app/api/vendors/[id]",
    "src/app/api/vendors/import",
    "src/app/api/requests",
    "src/app/api/requests/[id]",
    "src/app/api/requests/[id]/approve",
    "src/app/api/requests/[id]/purchasing",
    "src/app/api/purchase-orders",
    "src/app/employee/requests",
    "src/app/manager/approvals",
    "src/app/purchasing/vendors",
    "src/app/purchasing/requests",
    "src/lib"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# 2. Daftar file yang mau dibuat
$files = @(
    "src/app/api/vendors/route.ts",
    "src/app/api/vendors/[id]/route.ts",
    "src/app/api/vendors/import/route.ts",
    "src/app/api/requests/route.ts",
    "src/app/api/requests/[id]/route.ts",
    "src/app/api/requests/[id]/approve/route.ts",
    "src/app/api/requests/[id]/purchasing/route.ts",
    "src/app/api/purchase-orders/route.ts",
    "src/app/employee/requests/page.tsx",
    "src/app/manager/approvals/page.tsx",
    "src/app/purchasing/vendors/page.tsx",
    "src/app/purchasing/requests/page.tsx",
    "src/lib/prisma.ts"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        $dir = Split-Path -Path $file
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        New-Item -ItemType File -Path $file -Force | Out-Null
    }
}

Write-Host "Struktur folder & file selesai dibuat ✅"
