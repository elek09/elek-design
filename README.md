# ElekDesign

Ez a projekt az [Angular CLI](https://github.com/angular/angular-cli) 19.1.7 (később frissítve 20.x dependency-kre) segítségével készült.

## Telepítés és futtatás (Setup)

Az alábbi lépések egy frissen kibontott (zipből érkező) forráskódra vonatkoznak, `node_modules` és esetleges környezeti fájlok nélkül.

### Előfeltételek

- Node.js: ajánlott LTS (pl. 20.x). Ellenőrzés: `node -v`
- NPM a Node része: `npm -v`

### 1. Projekt kibontása

Csomagold ki a zip fájlt egy tetszőleges mappába, például: `C:\Projects\elek-design`. Győződj meg róla, hogy a gyökérben megtalálható a `package.json`, `angular.json`, `src/` mappa.

### 2. Függőségek telepítése

Lépj be a projekt gyökerébe, majd futtasd:

```powershell
npm install
```

Ez létrehozza a `node_modules` mappát az összes szükséges Angular és egyéb csomaggal.

### 3. Fejlesztői szerver indítása

```powershell
npm start
```

Alapértelmezett URL: http://localhost:4200/
Port módosítás (opcionális): `ng serve --port 4300`

### 4. Tesztek futtatása

```powershell
npm test
```

Karma + Jasmine egységteszt futtatás. Szükség esetén Chrome böngésző telepítése.

### 5. Production build készítése

```powershell
npm run build
```

Eredmény: `dist/elek-design` könyvtár. Fejlesztői (nem optimalizált) build: `ng build --configuration development`.

### 6. Deployment

A `dist/elek-design` tartalma statikusan szolgálható (pl. Nginx, Netlify, Vercel). Single Page App esetén állítsd be a fallback-et minden útvonalra az `index.html`-re (Nginx: `try_files $uri /index.html`).

### 7. Gyors parancs összefoglaló

```powershell
cd C:\Users\User1\Documents\elek-design-frontend\elek-design
npm install
npm start
npm test
npm run build
```

---

Az eredeti (angol) Angular CLI generált részek alább továbbra is megtalálhatóak referencia célból.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
