/**
 * Muestra IPs y URLs del frontend al iniciar npm start
 */
const os = require('os');
const https = require('https');

const PORT = process.env.PORT || '3001';

/**
 * Obtiene la primera IPv4 de la red local (no localhost)
 */
function getLocalNetworkIp() {

  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {

    for (const net of interfaces[name] || []) {

      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return null;
}

/**
 * Consulta la IP pública (WAN) vía ipify
 */
function getPublicIp() {

  return new Promise((resolve) => {

    const req = https.get('https://api.ipify.org?format=json', { timeout: 5000 }, (res) => {

      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(body).ip || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function main() {

  const localIp = getLocalNetworkIp();
  const publicIp = await getPublicIp();

  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('  Pasarela frontend — URLs de acceso');
  console.log('══════════════════════════════════════════════════════════');
  console.log('');

  if (localIp) {
    console.log(`  Red local (WiFi / LAN):  http://${localIp}:${PORT}`);
    console.log(`  Misma máquina:           http://localhost:${PORT}`);
  } else {
    console.log(`  Local:                   http://localhost:${PORT}`);
  }

  console.log('');

  if (publicIp) {
    console.log(`  IP pública (internet):   ${publicIp}`);
    console.log(`  Desde fuera (WAN):       http://${publicIp}:${PORT}`);
    console.log('  (requiere port forwarding en el router hacia este PC)');
  } else {
    console.log('  IP pública:              no disponible (sin internet o timeout)');
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('');
}

main();
