import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Colores Nequi exactos del diseño
const colors = {
    uva: '#200020',
    orquidea: '#da0081',
    white: '#ffffff',
    gray: '#666666',
    lightGray: '#f5f5f5'
};

// Estilos optimizados para PDF
const styles = StyleSheet.create({
    // Página 1 - Portada
    coverPage: {
        flexDirection: 'column',
        backgroundColor: colors.white,
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoCover: {
        width: 120,
        height: 'auto',
    },

    // Página 2 - Contenido
    contentPage: {
        flexDirection: 'column',
        backgroundColor: colors.white,
        padding: 40,
        paddingTop: 60,
    },

    // Título principal
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.uva,
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: 'Helvetica-Bold',
    },

    // Layout de campos
    fieldContainer: {
        marginBottom: 20,
        gap: 4,
    },
    label: {
        fontSize: 12,
        color: colors.orquidea,
        fontFamily: 'Helvetica',
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        color: colors.uva,
        fontFamily: 'Helvetica-Bold',
        lineHeight: 1.4,
    },
    valueNormal: {
        fontSize: 14,
        color: colors.uva,
        fontFamily: 'Helvetica',
    },

    // Sección especial "Tu plata salió de"
    sourceSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTop: `1px solid ${colors.lightGray}`,
    },
    sourceLabel: {
        fontSize: 12,
        color: colors.gray,
        marginBottom: 10,
    },
    sourceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sourceIcon: {
        width: 24,
        height: 24,
        backgroundColor: colors.orquidea,
        borderRadius: 4,
    },
    sourceText: {
        fontSize: 14,
        color: colors.uva,
        fontFamily: 'Helvetica-Bold',
    },

    // Monto destacado
    amountValue: {
        fontSize: 18,
        color: colors.uva,
        fontFamily: 'Helvetica-Bold',
    }
});

// Componente principal
const NequiReceiptPDF = ({ data }) => (
    <Document>
        {/* PÁGINA 1: PORTADA CON LOGO */}
        <Page size="A4" style={styles.coverPage}>
            <Image
                src={data.logoUrl || "https://pagos-pse.nequi.com.co/private/pagos/assets/img/nequi-logo.svg"}
                style={styles.logoCover}
            />
        </Page>

        {/* PÁGINA 2: RESUMEN DE PAGO */}
        <Page size="A4" style={styles.contentPage}>
            <Text style={styles.title}>Resumen de pago</Text>

            {/* Descripción */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Descripción de compra</Text>
                <Text style={styles.value}>{data.description}</Text>
            </View>

            {/* Estado */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Estado de la solicitud</Text>
                <Text style={styles.value}>{data.status}</Text>
            </View>

            {/* Tienda */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tienda</Text>
                <Text style={styles.value}>{data.store}</Text>
            </View>

            {/* Fecha */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Fecha de solicitud</Text>
                <Text style={styles.valueNormal}>{data.date}</Text>
            </View>

            {/* CUS */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>CUS</Text>
                <Text style={styles.valueNormal}>{data.cus}</Text>
            </View>

            {/* Referencia Nequi */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Referencia Nequi</Text>
                <Text style={styles.valueNormal}>{data.nequiReference}</Text>
            </View>

            {/* Monto */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>¿Cuánto?</Text>
                <Text style={styles.amountValue}>{data.amount}</Text>
            </View>

            {/* Impuestos */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Valor de los impuestos</Text>
                <Text style={styles.valueNormal}>{data.taxes}</Text>
            </View>

            {/* Referencia 1 (IP) */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Número de referencia 1</Text>
                <Text style={styles.valueNormal}>{data.refNumber1}</Text>
            </View>

            {/* Referencia 2 (Tipo doc) */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Número de referencia 2</Text>
                <Text style={styles.valueNormal}>{data.refNumber2}</Text>
            </View>

            {/* Referencia 3 (Número doc) */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Número de referencia 3</Text>
                <Text style={styles.valueNormal}>{data.refNumber3}</Text>
            </View>

            {/* Favoritos */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Comercio guardado en favoritos</Text>
                <Text style={styles.valueNormal}>{data.paymentMethod}</Text>
            </View>

            {/* Factura */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Factura de comercio</Text>
                <Text style={styles.valueNormal}>{data.invoiceNumber}</Text>
            </View>

            {/* Origen del dinero */}
            <View style={styles.sourceSection}>
                <Text style={styles.sourceLabel}>Tu plata salió de:</Text>
                <View style={styles.sourceBox}>
                    {/* Placeholder para el ícono de billetera - puedes reemplazar con Image */}
                    <View style={styles.sourceIcon} />
                    <Text style={styles.sourceText}>{data.sourceWallet}</Text>
                </View>
            </View>
        </Page>
    </Document>
);

export default NequiReceiptPDF;