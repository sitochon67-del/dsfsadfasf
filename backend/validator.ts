import { chromium } from "playwright";

const URL_NEQUI = 'https://clientes.nequi.com.co/recargas';

async function runBot() {

  // Abrir navegador
  const browser = await chromium.launch({
    headless: false // muestra la ventana
  });

  const page = await browser.newPage();

  // Ir a la URL
  await page.goto(URL_NEQUI);

  // Llenar campos
  await page.fill('#username', 'mi_usuario');
  await page.fill('#password', 'mi_password');

  // Click en botón
  await page.click('#login');

  // Esperar respuesta
  await page.waitForTimeout(5000);

  await browser.close();
}

runBot();