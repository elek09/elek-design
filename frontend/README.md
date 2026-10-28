# ElekDesign

Ez a projekt az [Angular CLI] segítségével készült.

## Telepítés és futtatás (Setup)

Az alábbi lépések egy frissen kibontott (zipből érkező) forráskódra vonatkoznak, `node_modules` és esetleges környezeti fájlok nélkül.

### Előfeltételek

- Node.js: ajánlott LTS (pl. 20.x). Ellenőrzés: `node -v`
- NPM a Node része: `npm -v`

### 1. Függőségek telepítése

Lépj be a projekt gyökerébe, majd futtasd:

```powershell
npm install
```

Ez létrehozza a `node_modules` mappát az összes szükséges Angular és egyéb csomaggal.

### 2. Fejlesztői szerver indítása

```powershell
npm start
```

Alapértelmezett URL: http://localhost:4200/
Port módosítás (opcionális): `ng serve --port 4300`

### 3. Gyors parancs összefoglaló

```powershell
cd C:\Users\User1\Documents\elek-design-frontend\elek-design
npm install
npm start
npm test
npm run build
```
