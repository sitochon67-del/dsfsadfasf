import { chromium, Browser, BrowserContext, Page } from 'playwright';

/**
 * Interface de respuesta del bot de recuperación Bancolombia
 */
export interface TransactionResponseBancolombia {
    success: boolean;
    status: string;
    txValue?: string | null;
    message?: string | null;
    lapTransactionState?: string | null;
    lapResponseCode?: string | null;
    transactionId?: string | null;
    referenceCode?: string | null;
    reference_pol?: string | null;
    pseReference1?: string | null;
    fechaTransaccion?: string | null;
    buyerEmail?: string | null;
    comprobanteUrl?: string | null;
}

/**
 * Bot encargado de automatizar la prueba del link PSE de Bancolombia
 * (botón ACEPTAR → captura URL de comprobante con parámetros en hash)
 */
export class botBancolombia {

    /** Instancia del navegador Chromium */
    private browser: Browser | null = null;

    /** Contexto de navegación (pestañas, cookies) */
    private context: BrowserContext | null = null;

    /** Página activa donde corre el flujo PSE */
    private page: Page | null = null;

    /**
     * Metodo encargado de extraer query params de URL normal o de hash
     * Ejemplo hash: #!/steps/comprobante?transactionId=...&lapTransactionState=APPROVED
     *
     * @param rawUrl URL completa capturada en navegación
     * @returns Parámetros parseados
     */
    private static getQueryParams(rawUrl: string): URLSearchParams {

        // Se usa el try catch para capturar errores de URL inválida
        try {

            // Se crea el objeto URL
            const url = new URL(rawUrl);

            // Se valida si los params vienen en search (?foo=bar)
            if (url.search && url.search.length > 1) {

                // Se retornan los parámetros del query string estándar
                return url.searchParams;
            }

            // Se captura el fragmento hash (SPA Angular)
            const hash = url.hash || '';

            // Se busca el inicio del query dentro del hash
            const qIndex = hash.indexOf('?');

            // Se valida si hay query dentro del hash
            if (qIndex !== -1) {

                // Se retornan los parámetros después del ? en el hash
                return new URLSearchParams(hash.slice(qIndex + 1));
            }

            // Se retorna searchParams vacío o parcial
            return url.searchParams;
        } catch {

            // Se retorna params vacíos si la URL no es parseable
            return new URLSearchParams();
        }
    }

    /**
     * Metodo encargado de validar si la URL es la pantalla de comprobante PSE
     *
     * @param rawUrl URL a evaluar
     * @returns true si contiene ruta y transactionId de comprobante
     */
    private static isComprobanteUrl(rawUrl: string): boolean {

        // Se valida ruta de comprobante y presencia de transactionId
        return rawUrl.includes('steps/comprobante') && rawUrl.includes('transactionId=');
    }

    /**
     * Metodo encargado de imprimir en consola cada cambio de URL (debug)
     *
     * @param source Origen del evento (poll, frame-main, post-goto, etc.)
     * @param rawUrl URL actual
     */
    private static logUrl(source: string, rawUrl: string): void {

        // Se imprime con prefijo para filtrar en logs del backend
        console.log(`[Bot URL][${source}] ${rawUrl}`);
    }

    /**
     * Metodo principal encargado de iniciar la automatización del link tester
     *
     * @param url URL del botón Bancolombia (transfer-gateway checkout)
     * @returns Resultado con parámetros del comprobante o estado de error
     */
    public async start(url: string): Promise<TransactionResponseBancolombia> {

        // Se usa el try catch para capturar errores de Playwright
        try {

            // Se inicia el navegador visible (headless: false para depuración)
            this.browser = await chromium.launch({ headless: false, slowMo: 60 });

            // Se crea el contexto y la página
            this.context = await this.browser.newContext();
            this.page = await this.context.newPage();

            // Se registra el listener ANTES de navegar (captura redirects post-ACEPTAR)
            const transactionPromise = this.listenTransactions();

            // Se loguea la URL inicial del link tester
            botBancolombia.logUrl('inicio', url);

            // Se navega al checkout de Bancolombia
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

            // Se loguea la URL tras la carga inicial
            botBancolombia.logUrl('post-goto', this.page.url());

            // Se busca y hace click en el botón ACEPTAR del modal
            await this.searchTransaccionBancolombia();

            // Se loguea la URL inmediatamente después del click
            botBancolombia.logUrl('post-aceptar', this.page.url());

            // Se espera hasta capturar comprobante, rechazo o timeout
            const result = await transactionPromise;

            // Se retorna el resultado al LinkTesterService
            return result;
        } catch (error) {

            // Se imprime el error en consola
            console.error('[Bot] Error ->', error);

            // Se retorna estado genérico de error
            return {
                success: false,
                status: 'ERROR'
            };
        } finally {

            // Se cierra el navegador al terminar (éxito o fallo)
            await this.browser?.close();
        }
    }

    /**
     * Metodo encargado de parsear la URL de comprobante y mapear campos PSE
     *
     * @param currentUrl URL capturada (gateway-abonos con hash comprobante)
     * @returns Objeto con parámetros o null si no es comprobante
     */
    private parseComprobanteUrl(currentUrl: string): TransactionResponseBancolombia | null {

        // Se valida que sea URL de comprobante
        if (!botBancolombia.isComprobanteUrl(currentUrl)) {
            return null;
        }

        // Se extraen parámetros (hash o query estándar)
        const params = botBancolombia.getQueryParams(currentUrl);

        // Se obtiene el estado de la transacción
        const lapTransactionState = params.get('lapTransactionState');

        // Se arma la respuesta con todos los campos requeridos por Telegram
        return {
            success: lapTransactionState === 'APPROVED',
            status: lapTransactionState || 'UNKNOWN',
            lapTransactionState,
            transactionId: params.get('transactionId'),
            referenceCode: params.get('referenceCode'),
            reference_pol: params.get('reference_pol'),
            message: params.get('message'),
            lapResponseCode: params.get('lapResponseCode'),
            txValue: params.get('TX_VALUE'),
            pseReference1: params.get('pseReference1'),
            buyerEmail: params.get('buyerEmail'),
            fechaTransaccion: params.get('extra3'),
            comprobanteUrl: currentUrl,
        };
    }

    /**
     * Metodo encargado de escuchar cambios de URL hasta capturar el comprobante
     * Escucha: framenavigated, load, nuevas pestañas y polling (hash SPA)
     *
     * @returns Promesa resuelta una sola vez con el resultado
     */
    private async listenTransactions(): Promise<TransactionResponseBancolombia> {

        // Se crea la promise encargada de esperar la respuesta final
        return new Promise((resolve) => {

            // Se valida que la página exista
            if (!this.page) {

                // Se retorna el resultado de la transacción
                return resolve({
                    success: false,
                    status: 'PAGE_NOT_INITIALIZED'
                });
            }

            // Bandera para resolver la promesa solo una vez
            let resolved = false;

            // Última URL logueada (evita spam en consola)
            let lastLoggedUrl = '';

            // Referencias a timers para limpiarlos al finalizar
            let pollId: ReturnType<typeof setInterval>;
            let timeoutId: ReturnType<typeof setTimeout>;

            /**
             * Cierra listeners y resuelve la promesa
             */
            const finish = (result: TransactionResponseBancolombia) => {

                // Se evita doble resolución
                if (resolved) return;

                // Se marca como resuelto
                resolved = true;

                // Se limpia el intervalo
                clearInterval(pollId);

                // Se limpia el timeout
                clearTimeout(timeoutId);

                // Se retorna el resultado
                resolve(result);
            };

            /**
             * Evalúa cada URL: loguea, intenta parsear comprobante o detectar rechazo
             */
            const tryCapture = (rawUrl: string, source: string) => {

                // Se ignora si ya se capturó el comprobante
                if (resolved) return;

                // Se loguea solo si la URL cambió
                if (rawUrl !== lastLoggedUrl) {

                    // Se actualiza la URL logueada
                    lastLoggedUrl = rawUrl;

                    // Se imprime la URL en consola
                    botBancolombia.logUrl(source, rawUrl);
                }

                // Se intenta parsear como comprobante (gateway-abonos #!/steps/comprobante)
                const comprobante = this.parseComprobanteUrl(rawUrl);

                // Se valida si se capturó el comprobante
                if (comprobante) {

                    // Se finaliza con éxito
                    finish(comprobante);

                    // Se retorna
                    return;
                }

                // Se valida popup de rechazo PSE (ePayco u otro gateway)
                if (rawUrl.includes('/popup/response/pse/')) {

                    // Se obtiene el estado de la transferencia
                    const transferState = rawUrl.includes('transferState=rejected') ? 'rejected' : null;

                    // Se valida si la transferencia es rechazada
                    if (transferState === 'rejected') {

                        // Se finaliza con éxito
                        finish({
                            success: false,
                            status: 'REJECTED'
                        });
                    }
                }
            };

            // Tiempo máximo de espera (3 min) si no aparece comprobante
            const timeoutMs = 180000;

            // Se crea el timeout
            timeoutId = setTimeout(() => {

                // Se imprime el timeout en consola
                console.log('[Bot] TIMEOUT — no se capturó comprobante');

                // Se finaliza con éxito
                finish({
                    success: false,
                    status: 'TIMEOUT'
                });
            }, timeoutMs);

            // Se escucha navegación en todos los frames (main e iframes)
            this.page.on('framenavigated', (frame) => {

                // Se obtiene la URL del frame
                const url = frame.url();

                // Se valida si la URL es vacía
                if (!url || url === 'about:blank') return;

                // Se obtiene el origen del frame
                const source = frame === this.page?.mainFrame() ? 'frame-main' : 'frame-child';

                // Se intenta capturar la transacción
                tryCapture(url, source);
            });

            // Se escucha evento load de la página principal
            this.page.on('load', () => {

                // Se intenta capturar la transacción
                tryCapture(this.page!.url(), 'page-load');
            });

            // Se escucha si se abre nueva pestaña/ventana tras ACEPTAR
            this.context!.on('page', (newPage) => {

                // Se imprime la nueva pestaña/ventana en consola
                console.log('[Bot] Nueva pestaña/ventana detectada');

                // Se escribe el listener para la nueva pestaña/ventana
                newPage.on('framenavigated', (frame) => {
                    tryCapture(frame.url(), 'new-page-frame');
                });

                // Se escribe el listener para la nueva pestaña/ventana
                newPage.on('load', () => {
                    tryCapture(newPage.url(), 'new-page-load');
                });
            });

            // Polling: captura cambios de hash SPA que no disparan framenavigated
            pollId = setInterval(() => {

                // Se valida si la página existe
                if (resolved || !this.page) return;

                // Se intenta capturar la transacción
                tryCapture(this.page.url(), 'poll');

                // Se recorren los frames hijos
                this.page.frames().forEach((frame) => {

                    // Se intenta capturar la transacción
                    tryCapture(frame.url(), 'poll-frame');
                });
            }, 800);
        });
    }

    /**
     * Metodo encargado de buscar el botón ACEPTAR y hacer click
     * Recorre todos los button del DOM hasta encontrar texto "ACEPTAR"
     */
    private async searchTransaccionBancolombia(): Promise<void> {

        // Se valida que la página esté disponible
        if (!this.page) return;

        // Tiempo máximo de búsqueda del botón (2 min)
        const timeout = 120000;

        // Intervalo entre intentos
        const interval = 2000;

        // Marca de tiempo inicial del loop
        const startTime = Date.now();

        // Se imprime en consola que se está buscando el botón ACEPTAR
        console.log('[Bot] Buscando botón ACEPTAR...');

        // Se repite hasta encontrar ACEPTAR o agotar timeout
        while (Date.now() - startTime < timeout) {

            // Se obtienen todos los botones visibles en la página
            const buttons = await this.page.locator('button').all();

            // Se recorre cada botón
            for (const button of buttons) {

                // Se usa el try catch para capturar errores
                try {

                    // Se normaliza el texto del botón
                    const text = (await button.textContent())?.trim().toUpperCase();

                    // Se valida si es el botón ACEPTAR del modal Bancolombia
                    if (text === 'ACEPTAR') {

                        console.log('[Bot] Click en ACEPTAR');

                        // Se hace click forzado (modal puede tapar el botón)
                        await button.click({ force: true });

                        // Se espera a que inicie la redirección al gateway
                        await this.page.waitForTimeout(2000);

                        // Se loguea la URL justo después del click
                        botBancolombia.logUrl('inmediato-post-click', this.page.url());

                        // Se sale del método (el listener capturará el comprobante)
                        return;
                    }
                } catch {

                    // Se ignoran botones destruidos por re-render del DOM
                    continue;
                }
            }

            // Se espera antes del siguiente ciclo de búsqueda
            await this.page.waitForTimeout(interval);
        }

        // Se informa si no se encontró el botón en el tiempo límite
        console.log('[Bot] No se encontró botón ACEPTAR en el tiempo límite');
    }
}
