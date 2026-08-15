import { chromium, Browser, BrowserContext, Page } from 'playwright';

/**
 * Interface de respuesta
 */
export interface TransactionResponse {
    success: boolean;
    status: string;
    txValue?: string | null;
    message?: string | null;
    lapTransactionState?: string | null;
    fechaTransaccion?: string | null;
    buyerEmail?: string | null;
}

/**
 * Servicio encargado de automatizar
 * la pasarela de Bancolombia
 */
export class BotService {

    /**
     * Instancia del navegador
     */
    private browser: Browser | null = null;

    /**
     * Instancia del contexto
     */
    private context: BrowserContext | null = null;

    /**
     * Instancia de la página
     */
    private page: Page | null = null;

    /**
     * Método principal encargado de iniciar
     * la automatización
     * 
     * @param url URL de la transacción
     * @returns Resultado de la transacción
     */
    public async start(url: string): Promise<TransactionResponse> {

        // Se usa el try catch para capturar los errores
        try {

            // Se inicializa el navegador
            this.browser = await chromium.launch({
                headless: false,
                slowMo: 60
            });

            // Se inicializa el contexto
            this.context = await this.browser.newContext();

            // Se inicializa la página
            this.page = await this.context.newPage();

            // Se crea la promise encargada de esperar la respuesta final
            const transactionPromise = this.listenTransactions();

            // Se navega hacia la URL
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });

            // Se busca el botón aceptar
            await this.searchTransaccionBancolombia();

            // Se espera el resultado
            const result = await transactionPromise;

            // Se retorna el resultado
            return result;
        } catch (error) {

            // Se imprime el error en consola
            console.error('Error ->', error);

            // Se retorna el resultado de la transacción
            return {
                success: false,
                status: 'ERROR'
            };
        } finally {

            // Se cierra el navegador
            await this.browser?.close();
        }
    }

    /**
     * Método encargado de escuchar
     * cambios de navegación
     */
    private async listenTransactions(): Promise<TransactionResponse> {

        // Se crea la promise encargada de esperar la respuesta final
        return new Promise((resolve) => {

            // Se valida si la página existe
            if (!this.page) {

                // Se retorna el resultado de la transacción
                return {
                    success: false,
                    status: 'PAGE_NOT_INITIALIZED'
                };
            }

            // Se escucha la navegación
            this.page.on('framenavigated', frame => {

                // Se valida si el frame es el principal
                if (frame !== this.page?.mainFrame()) {
                    return;
                }

                // Se obtiene la URL actual
                const currentUrl = frame.url();

                // Se imprime la URL actual en consola
                console.log('currentUrl -> ', currentUrl);

                // Se valida si la URL es de comprobante
                if (currentUrl.includes('/steps/comprobante')) {

                    // Se parsea la URL
                    const url = new URL(currentUrl);

                    // Se obtienen los parámetros
                    const txValue = url.searchParams.get('TX_VALUE');
                    const message = url.searchParams.get('message');
                    const lapTransactionState = url.searchParams.get('lapTransactionState');
                    const extra3 = url.searchParams.get('extra3');
                    const email = url.searchParams.get('buyerEmail');

                    // Se valida si la transacción es aprobada
                    if (lapTransactionState === 'APPROVED') {

                        // Se imprime la transacción aprobada en consola
                        console.log('========================');
                        console.log('Transacción aprobada');
                        console.log('TX_VALUE ->', txValue);
                        console.log('message ->', message);
                        console.log('lapTransactionState ->', lapTransactionState);
                        console.log('fechaTransaccion -> ', extra3);
                        console.log('buyerEmail -> ', email);
                        console.log('========================');

                        // Se retorna la respuesta final
                        resolve({
                            success: true,
                            status: 'APPROVED',
                            txValue,
                            message,
                            lapTransactionState,
                            fechaTransaccion: extra3,
                            buyerEmail: email
                        });
                    }
                } else if (currentUrl.includes('/popup/response/pse/')) {

                    // Se valida si la URL es de rechazo ePayco
                    const transferState = currentUrl.includes('transferState=rejected')
                        ? 'rejected'
                        : null;

                    console.log('========================');
                    console.log('Estado transferencia ->', transferState);
                    console.log('========================');

                    // Se valida si la transferencia es rechazada
                    if (transferState === 'rejected') {

                        // Se imprime el estado de la transferencia en consola
                        resolve({
                            success: false,
                            status: 'REJECTED'
                        });
                    }
                }
            });
        });
    }

    /**
     * Método encargado de buscar
     * botón aceptar
     */
    private async searchTransaccionBancolombia(): Promise<void> {

        // Se valida si la página existe
        if (!this.page) {

            // Se retorna
            return;
        }

        // Se espera el renderizado
        await this.page.waitForTimeout(5000);

        // Se obtienen los contenedores
        const containers = await this.page.locator('.bc-modal-button-container').all();

        // Se recorren los contenedores
        for (const container of containers) {

            // Se busca el botón
            const button = container.locator('button');

            // Se verifica la existencia del botón
            const count = await button.count();

            // Se valida si el botón existe
            if (count === 0) {

                // Se continua el recorrido
                continue;
            }

            // Se obtiene el texto del botón
            const text = (await button.textContent())?.trim().toUpperCase();

            // Se valida si el texto es ACEPTAR
            if (text === 'ACEPTAR') {

                // Se espera adicional
                await this.page.waitForTimeout(3000);

                // Se hace click forzado
                await button.click({
                    force: true
                });

                // Se retorna
                return;
            }
        }
    }
}