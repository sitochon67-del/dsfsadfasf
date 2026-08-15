#!/bin/bash
# Script para actualizar el webhook de Telegram
TELEGRAM_BOT_TOKEN="8605414212:AAEJhb5Wn5J3FFsbpVOflcB7eJWMmYLRHhs"
NGROK_URL="https://pymes-backend.vercel.app"
WEBHOOK_URL="${NGROK_URL}/api/v1/telegram-webhook"

# 1. Eliminar webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook" \
  -H "Content-Type: application/json" \
  -d "{}"

echo "🔄 Actualizando webhook de Telegram..."
echo "URL: ${WEBHOOK_URL}"

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}"

echo ""
echo "✅ Webhook actualizado"
echo ""
echo "Para verificar el webhook actual, ejecuta:"
echo "curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"