## Elek Design Backend – Gyors telepítés (ZIP forrásból)

Ez a rövid útmutató arra az esetre készült, amikor csak a forráskódot kapod meg (nincs `vendor/`, nincs `.env`).

### 1. Előfeltételek

-   PHP >= 8.2
-   Composer
-   Node.js (npm)
-   SQLite (egyszerű fejlesztéshez) vagy MySQL/MariaDB

Ellenőrzés:

```powershell
php -v
composer -V
node -v
npm -v
```

### 2. Kicsomagolás

Másold/kicsomagold a projektet pl. `C:\Projects\elek-design\backend` könyvtárba, majd:

```powershell
Set-Location C:\Projects\elek-design\backend
```

### 3. .env létrehozása

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

```
MAIL_MAILER=smtp
```

SQLite használatához (ha kell):

```powershell
New-Item .\database\database.sqlite -ItemType File
```

### 4. Függőségek

```powershell
composer install
npm install
```

### 5. Migráció + Seed (opcionális demó adatok)

```powershell
php artisan migrate --seed
```

Teljes újraépítéshez:

```powershell
php artisan migrate:fresh --seed
```

### 6. Storage link

```powershell
php artisan storage:link
```

### 7. Fejlesztői mód

Két külön PowerShell ablakban:

```powershell
php artisan serve
```

```powershell
npm run dev
```

Alap URL: `http://127.0.0.1:8000`

### 8. Admin belépés

-   Alap admin email: `admin@elekdesign.hu`
-   A jelszó NINCS a kódban tárolt plaintextként. Állítsd be `.env`-ben:
    -   `ADMIN_DEFAULT_PASSWORD` (plain) VAGY `ADMIN_DEFAULT_PASSWORD_HASH` (bcrypt hash), majd futtasd a seedet.
    -   Alternatíva: hozd létre/frissítsd a jelszót a parancsunkkal: lásd 8/a.

Ha nem működik: ellenőrizd, hogy futott-e a seeding és be volt-e állítva a jelszó `.env`-ben.

### 8/a. Admin felhasználók kezelése (parancsok)

Két saját Artisan parancs áll rendelkezésre:

1. Admin létrehozása vagy frissítése (felülírás `--force` kapcsolóval):

```powershell
php artisan user:create-admin ujadmin@example.com "Új Admin" ErősJelszo456!
```

Létező email felülírása (név + jelszó frissül):

```powershell
php artisan user:create-admin ujadmin@example.com "Új Admin" UjJelszo789! --force
```

2. Admin törlése vagy admin jog visszavonása:

```powershell
# Teljes törlés
php artisan user:delete-admin ujadmin@example.com

# Csak admin jog elvétele, user megmarad
php artisan user:delete-admin ujadmin@example.com --soft

# Megerősítés kihagyása
php artisan user:delete-admin ujadmin@example.com --force
```

Megjegyzés: A létrehozó parancsban kötelező a jelszó argumentum, nincs automatikus generálás.

### 9. Gyors hibakeresés

```powershell
php artisan optimize:clear
php artisan migrate:fresh --seed
composer dump-autoload
```

Logok: `storage/logs/laravel.log`

### 10. Parancsblokk összefoglaló (copy/paste)

```powershell
Set-Location C:\Projects\elek-design\backend
Copy-Item .env.example .env
php artisan key:generate
composer install
npm install
New-Item .\database\database.sqlite -ItemType File
php artisan migrate --seed
php artisan storage:link
php artisan serve
npm run dev
```

### 11. Tesztek

```powershell
php artisan test
```

### 12. Production röviden

Állítsd `APP_ENV=production`, `APP_DEBUG=false`, majd:

```powershell
php artisan optimize
```
