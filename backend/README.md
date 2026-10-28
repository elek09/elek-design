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

### 2. .env létrehozása

Lépj be a projekt gyökerébe, majd futtasd:

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

### 3. Függőségek

```powershell
composer install
npm install
```

### 4b. Admin jelszó beállítása

Nyisd meg a `.env` fájlt és add hozzá:

```
ADMIN_DEFAULT_PASSWORD=
vagy
ADMIN_DEFAULT_PASSWORD_HASH=
```

Ezt a jelszót használja a seeder az admin felhasználó létrehozásához. Később megváltoztatható a `user:create-admin` paranccsal (lásd 8/a pont).

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

### 7. Futtatás

```powershell
php artisan serve
```

Alap URL: `http://127.0.0.1:8000`

### 8. Admin belépés

-   Alap admin email: `admin@elekdesign.hu`
-   A jelszó NINCS a kódban tárolt plaintextként. Állítsd be `.env`-ben:

### 8/a. Admin felhasználók kezelése (parancsok)

Két saját Artisan parancs áll rendelkezésre:

1. Admin létrehozása vagy frissítése (felülírás `--force` kapcsolóval):

```powershell
php artisan user:create-admin ujadmin@example.com "Új Admin" ErősJelszo456!
```

Létező email felülírása (név + jelszó frissül):

```powershell
php artisan user:create-admin ujadmin@example.com "Új Admin" UjJelszo789! --force
php artisan user:create-admin admin@elekdesign.hu "Elek Admin" ElekAdmin2025! --force

```

2. Admin törlése vagy admin jog visszavonása:

```powershell
# Teljes törlés
php artisan user:delete-admin ujadmin@example.com

# Megerősítés kihagyása
php artisan user:delete-admin ujadmin@example.com --force
```

### 9. Gyors hibakeresés

```powershell
php artisan optimize:clear
php artisan migrate:fresh --seed
composer dump-autoload
```

Logok: `storage/logs/laravel.log`

### 10. Parancsblokk összefoglaló

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
