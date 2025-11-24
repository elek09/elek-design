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

### 8. Auth összefoglaló

Alap autentikáció: Laravel session alapú `web` guard + Sanctum stateful cookie. A böngésző (Angular) `withCredentials: true` beállítással automatikusan küldi a sütiket; nincs szükség JWT-re vagy bearer tokenre.

Válasz séma minden auth endpointnál: `success` (bool), `status` (int), `data` (objektum), `errors` (tömb vagy üres). A `data.user` tartalmazza: `id, name, email, admin`.

Admin felületek nem külön bejelentkezést használnak; az általános login után az admin API route-ok `admin.api` middleware-rel védettek. `GET /api/v1/admin/me` visszaadja a bejelentkezett admin felhasználót.

Későbbi igény esetén stateless API-hoz bevezethető Sanctum personal access token vagy JWT; jelenleg nincs token kiadás / törlés logika.

### 8. Admin belépés

-   Alap admin email: `admin@elekdesign.hu`
-   A jelszó NINCS a kódban tárolt plaintextként. Állítsd be `.env`-ben:

### 9. Adatmodell normalizálási megjegyzések

1. `gallery_items` táblában bevezetésre került a `category_id` (FK → `categories.id`) oszlop a korábbi szöveges `category` mező mellé. A migráció visszatölti azokat a sorokat, ahol a `category` megegyezik egy `categories.type` értékkel. A JSON-ben tárolt alkategóriák / speciális értékek (`featured`, `egyeb`) továbbra is a legacy `category` mezőben maradnak, amíg nem készül külön alkategória táblára vonatkozó normalizálás.

    - Új írásnál preferált: küldj `category_id`-t; a rendszer a legacy `category` mezőt automatikusan kitölti a megfelelő `type`-pal.
    - Olvasásnál átmenetileg mindkét mező elérhető. Jövőben a `category` mező elavulttá válhat.

2. `orders` táblában a `customer_name`, `customer_email`, `customer_phone` mezők megmaradnak a vendég (guest) rendelések miatt, de ha `user_id` érték is van, akkor az OrderService létrehozáskor a név és email a felhasználóból származik. A modellben elérhető: `effective_customer_name`, `effective_customer_email`, `effective_customer_phone` accessorok, amelyek preferálják a felhasználói adatokat, így elkerülhető a duplikáció kezelése a kliens oldalon.

    - További lépésként bevezethető külön `order_contacts` tábla snapshot tárolásra, ha a felhasználói adatok változásainak auditálása szükséges.

    - `ADMIN_DEFAULT_PASSWORD` (plain) VAGY `ADMIN_DEFAULT_PASSWORD_HASH` (bcrypt hash), majd futtasd a seedet.
    - Alternatíva: hozd létre/frissítsd a jelszót a parancsunkkal: lásd 8/a.

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
