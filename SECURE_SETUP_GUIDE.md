# Secure Webhook Approval Setup with API Key

## 🔐 API Key Configuration

Your API key is set in the `.env` file:
```
API_KEY=wh-approval-key-a7f8d9e2b4c6
```

**IMPORTANT:** Change this to a secure value in production!

## 📋 n8n Configuration

### In n8n, create a Header Auth credential:

1. Go to **Credentials** → **New** → **Header Auth**
2. Configure:
   - **Name:** `Webhook Approval API`
   - **Header Name:** `X-API-Key`
   - **Header Value:** `wh-approval-key-a7f8d9e2b4c6`

### HTTP Request Node Setup:

1. **Method:** `POST`
2. **URL:** `https://carter.ngrok.app/webhook/register`
3. **Authentication:** `Header Auth`
4. **Credential:** Select `Webhook Approval API`
5. **Send Body:** `JSON`
6. **Body:**
```json
{
  "executionId": "{{ $execution.id }}",
  "resumeUrl": "{{ $execution.resumeUrl }}",
  "workflowName": "{{ $workflow.name }}",
  "data": {
    "description": "{{ $json.description || 'Approval needed' }}",
    "amount": "{{ $json.amount || 0 }}",
    "requestor": "{{ $json.requestor || 'System' }}"
  }
}
```

## 🧪 Test with CURL

### Test with valid API key:
```bash
curl -X POST https://carter.ngrok.app/webhook/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wh-approval-key-a7f8d9e2b4c6" \
  -d '{
    "executionId": "test-secure-123",
    "resumeUrl": "https://webhook.site/test",
    "workflowName": "Secure Test",
    "data": {
      "description": "Testing secure endpoint",
      "amount": 500
    }
  }'
```

### Alternative header format (Authorization):
```bash
curl -X POST https://carter.ngrok.app/webhook/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wh-approval-key-a7f8d9e2b4c6" \
  -d '{
    "executionId": "test-auth-456",
    "resumeUrl": "https://webhook.site/test",
    "workflowName": "Auth Test",
    "data": {}
  }'
```

### Test without API key (should fail):
```bash
curl -X POST https://carter.ngrok.app/webhook/register \
  -H "Content-Type: application/json" \
  -d '{
    "executionId": "test-fail",
    "resumeUrl": "https://webhook.site/test"
  }'
```
Expected response: `401 Unauthorized`

### Test with wrong API key (should fail):
```bash
curl -X POST https://carter.ngrok.app/webhook/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{
    "executionId": "test-wrong",
    "resumeUrl": "https://webhook.site/test"
  }'
```
Expected response: `403 Forbidden`

## 🔒 Security Features

1. **API Key Required:** Only requests with valid API key can register webhooks
2. **Multiple Header Support:** Accepts both `X-API-Key` and `Authorization` headers
3. **Bearer Token Support:** Can use `Authorization: Bearer <key>` format
4. **Public Dashboard:** The approval dashboard remains public for easy access
5. **Protected Registration:** Only the webhook registration endpoint requires authentication

## 🚀 Complete Workflow

1. n8n workflow triggers
2. HTTP Request node sends execution details WITH API KEY
3. Server validates API key before accepting registration
4. Wait node pauses execution
5. Open https://carter.ngrok.app (no auth needed)
6. Click Approve/Reject
7. Server calls n8n's resumeUrl
8. Workflow continues

## 📝 Environment Variables

Create/modify `.env` file:
```bash
# Required
API_KEY=your-secure-api-key-here

# Optional
PORT=3000
```

## 🔄 Restart Server

After changing the API key:
```bash
npm start
```

The server will show:
```
====================================
Webhook approval server running on port 3000
Dashboard: http://localhost:3000
====================================
API Authentication Enabled:
API Key: wh-appro...c6
Use header: X-API-Key or Authorization
====================================
```