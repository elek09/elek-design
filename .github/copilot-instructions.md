# ElekDesign Project Guidelines

## Repository structure

This repository contains two independently runnable applications:

- `frontend/` is an Angular 20 standalone application. Its public pages and admin UI are under `frontend/src/app`, with feature pages and admin areas lazy-loaded from the route table.
- `backend/` is a Laravel 12 API. HTTP controllers expose the `/api/v1` endpoints, while models, resources, services, middleware, migrations, and seeders provide the domain and persistence layers.

Run commands from the directory belonging to the application being changed. The frontend and backend have separate `package.json` files and lockfiles.

## Build, run, test, and lint

### Frontend

From `frontend/`:

```powershell
npm install
npm start                         # Angular dev server at http://localhost:4200
npm run build                     # production build
npm run watch                     # development watch build
npm test                          # Karma/Jasmine tests
npm test -- --watch=false --include src/app/path/to/example.spec.ts
npm run lint
npm run lint:fix
```

The frontend has Angular ESLint and Prettier integration. Production builds enforce the bundle and component-style budgets in `frontend/angular.json`.
After every substantial frontend change, run `npm run build` from `frontend/` and report the resulting `frontend/dist/elek-design` directory as the deployable build. The developer uploads this generated `dist` version manually; do not deploy it or commit generated build output.

### Backend

From `backend/`:

```powershell
composer install
npm install
php artisan serve                  # Laravel API at http://127.0.0.1:8000
npm run build                      # Vite asset build
npm run dev                        # Vite development server
php artisan test
php artisan test tests/Feature/OrderApiTest.php
php artisan test --filter=test_name
vendor/bin/pint --test             # check PHP formatting
vendor/bin/pint                    # apply PHP formatting
```

For a fresh local setup, copy `.env.example` to `.env`, run `php artisan key:generate`, create `database/database.sqlite` when using SQLite, then run `php artisan migrate --seed`. Use `php artisan storage:link` when working with uploaded/public media. The backend README contains the admin-user commands and environment variables.

## Architecture and request flow

- The Angular app is bootstrapped with `bootstrapApplication` in `frontend/src/main.ts`; global providers, routing, HTTP, locale (`hu-HU`), Toastr, and startup initializers are configured in `frontend/src/app/app.config.ts`.
- `API_BASE_URL` is selected at runtime: local browser hosts use `http://localhost:8000`, while other hosts use `https://api.elekdesign.hu`. Use this injected token and existing service helpers rather than hard-coding a new API origin.
- Frontend services use Angular `HttpClient` and typed model/resource shapes. Public data is fetched from `/api/v1`; the `BootstrapService` loads and caches the header navigation, categories, and featured gallery data used during application startup.
- Authentication is Laravel Sanctum session/cookie authentication, not a frontend bearer-token flow. The app requests `/sanctum/csrf-cookie` during initialization, sends credentials on auth requests, and uses the auth interceptor plus `authGuard` for expired sessions and protected admin routes.
- Backend routes are grouped under `routes/api.php` with the `v1` prefix. Public products, categories, gallery, contact, and order-submission endpoints are separate from authenticated user routes and the `admin` group. Admin routes require both `auth:sanctum` and `admin.api`.
- Backend controllers delegate reusable domain work to services such as `AuthService`, `GalleryService`, and `NavigationService`; API response shape belongs in `Http/Resources` classes. Preserve the existing `{ success, data }` response convention when adding endpoints.
- `BootstrapController` caches the public startup payload under `bootstrap:v1`. Admin callers can request `?fresh=1` to invalidate that cache after content/category changes; mutations should continue to refresh or invalidate related cached data through the existing service patterns.

## Repository-specific conventions

- Prefer standalone Angular components and route-level `loadComponent` lazy loading. New public/admin pages should be added to `frontend/src/app/app.routes.ts` and should use `authGuard` for admin screens.
- Follow the existing Angular dependency-injection style (`inject(...)`), typed interfaces in `models/`, and service-owned HTTP calls. Keep components focused on presentation/state orchestration rather than duplicating endpoint URLs.
- Preserve the frontend's API URL helpers and URL normalization utilities when handling media paths; backend media URLs may be relative or absolute.
- Keep user-facing text and locale-sensitive behavior consistent with the existing Hungarian UI and `hu-HU` locale registration.
- In Laravel, keep endpoint authorization in route middleware and request validation in Form Request classes. Use policies/middleware and existing admin checks instead of duplicating authorization inside unrelated controllers.
- Use API Resources to control public versus admin representations. `CategoryResource`, for example, exposes extra ordering and relationship fields only for admin API paths.
- Use migrations, factories, and seeders for database changes and demo data. Do not edit the database schema manually or commit local `.env`, SQLite, storage, or generated build artifacts.
- When changing admin gallery, category, subcategory, or order behavior, check both the corresponding Laravel admin route/controller and the matching Angular admin service/component; these surfaces are intentionally coupled.

## Source-of-truth documentation

- Frontend setup and scripts: `frontend/README.md`
- Backend setup, environment, migrations, admin commands, and troubleshooting: `backend/README.md`
- Angular build/test/lint targets: `frontend/angular.json` and `frontend/package.json`
- Laravel dependencies, scripts, and test entry point: `backend/composer.json`
