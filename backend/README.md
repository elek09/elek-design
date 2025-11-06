composer install
copy .env.example .env
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
php artisan serve

{
"email": "admin@elekdesign.hu",
"password": "ElekAdmin2025!"
}

## Database

The schema is designed to be simple, data-driven, and cache-friendly:

-   Users include an `admin` boolean flag (default false) to separate public users from administrators.
-   Products use `is_active` (boolean) to control catalog visibility without deleting content.
-   Gallery items use both `is_active` (for visibility) and `is_featured` (for curated “Top” selections on the homepage and Bootstrap payload).
-   Categories store a Hungarian `type` (stable identifier), human-friendly `name`, an optional JSON `subcategories` array, and `nav_order` to define header order. The presence of subcategories also drives whether a header item is exposed as a homepage fragment or a route.

The API exposes a single canonical gallery listing route by section:

-   `GET /api/v1/gallery/section/{section}?page=1` (e.g., `eletter`, `uzletter`, `3d-falboritas`, `ives-butorok`)
-   `GET /api/v1/gallery/top` returns featured items.
-   `GET /api/v1/bootstrap` returns the consolidated startup payload (header, categories, featured) and is cached for 5 minutes.

Notes:

-   All media URLs in the API are absolute (built via `asset()`), so frontends can pass them through without origin handling.
-   Migrations were squashed so that base “create” migrations reflect the final schema (with `is_active`, `is_featured`, and `nav_order` included). Follow-up migrations remain guarded no-ops for compatibility and narrative.

## Troubleshooting

-   Seeding error: table column missing (e.g., `gallery_items has no column named is_active`)
	-   Cause: Local SQLite schema drifted from current migrations.
	-   Fix: Rebuild the database and reseed.

		PowerShell:

		```powershell
		php artisan migrate:fresh --seed
		```

-   Duplicate column error during migrate (e.g., `duplicate column name: is_active` on products)
	-   Ensure you have the latest code. Follow-up migrations are guarded to be safe no-ops on fresh installs.
