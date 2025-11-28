# Elek Design - Teljes Projekt

Full-stack webshop alkalmazás Laravel backend és Angular frontend használatával.

## 🚀 Gyors Indítás

### Előfeltételek

- **PHP** >= 8.2
- **Composer**
- **Node.js** (LTS, pl. 20.x)
- **NPM**
- **SQLite** vagy MySQL

Ellenőrzés:

```powershell
php -v
composer -V
node -v
npm -v
```

### Telepítés és Indítás

#### 1. Backend (Laravel)

```powershell
cd backend
Copy-Item .env.example .env
php artisan key:generate
composer install
npm install
New-Item .\database\database.sqlite -ItemType File
php artisan migrate --seed
php artisan storage:link
```

**Admin jelszó beállítása** - Szerkeszd a `.env` fájlt:

```
ADMIN_DEFAULT_PASSWORD=your-password
```

**Admin létrehozása/módosítása:**

```powershell
php artisan user:create-admin admin@elekdesign.hu "Admin" jelszó123 --force
```

**Backend indítása** (2 külön terminálban):

```powershell
php artisan serve          # API: http://127.0.0.1:8000
npm run dev                # Asset build
```

#### 2. Frontend (Angular)

```powershell
cd frontend
npm install
npm start                  # Frontend: http://localhost:4200
```

## 📁 Projekt Struktúra

```
elek-design/
├── backend/              # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Mail/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
└── frontend/             # Angular SPA
    └── src/
        ├── app/
        │   ├── components/
        │   ├── services/
        │   ├── guards/
        │   └── models/
        └── assets/
```

## 🔑 Autentikáció

- **Laravel Session + Sanctum** stateful cookie alapú
- **Frontend:** `withCredentials: true` (automatikus cookie kezelés)
- **Admin védelem:** `admin.api` middleware
- **Admin endpoint:** `GET /api/v1/admin/me`

Alap admin: `admin@elekdesign.hu` (jelszó: `.env`-ben beállítva)

## 🛠️ Fejlesztés

### Backend parancsok

```powershell
# Tesztek
php artisan test

# Cache törlés
php artisan optimize:clear

# DB újraépítés
php artisan migrate:fresh --seed

# Admin törlés
php artisan user:delete-admin email@example.com
```

### Frontend parancsok

```powershell
# Tesztek
npm test

# Production build
npm run build

# Új komponens
ng generate component component-name
```

## 📦 Production

### Backend

```powershell
# .env beállítások
APP_ENV=production
APP_DEBUG=false

php artisan optimize
```

### Frontend

```powershell
npm run build
# dist/elek-design → statikus szerver (Nginx, Vercel, Netlify)
```

## 🗄️ Adatbázis

### Főbb táblák

- `users` - Felhasználók (admin flag)
- `products` - Termékek
- `categories` / `subcategories` - Kategóriák
- `orders` / `order_items` - Rendelések
- `gallery_items` - Galéria képek (category_id FK)

### Normalizálás megjegyzések

- `gallery_items.category_id` használata preferált (legacy `category` mező átmeneti)
- `orders` táblában `effective_*` accessorok a user/guest adatok kezelésére

## 📧 Email

Mail beállítás `.env`-ben:

```
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=...
```

## 🔍 Hibakeresés

**Backend logok:** `backend/storage/logs/laravel.log`

**Gyakori megoldások:**

```powershell
composer dump-autoload
php artisan optimize:clear
php artisan migrate:fresh --seed
```

## 📚 További Dokumentáció

- [Laravel Dokumentáció](https://laravel.com/docs)
- [Angular Dokumentáció](https://angular.dev)
- Backend részletes README: `backend/README.md`
- Frontend részletes README: `frontend/README.md`
