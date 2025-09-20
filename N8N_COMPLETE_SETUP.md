# n8n Wait Node with Human-in-the-Loop Complete Setup

## 🔑 Step 1: Create Header Auth Credential in n8n

1. In n8n, go to **Credentials** → **Create New** → **Header Auth**
2. Configure the credential:
   - **Name:** `Webhook Approval API`
   - **Header Name:** `X-API-Key`
   - **Header Value:** `YOUR_API_KEY_HERE` (replace with your actual key from .env file)

> **Your API Key:** `wh-approval-key-a7f8d9e2b4c6` (change in production!)

## 📋 Step 2: Add HTTP Request Node (BEFORE Wait Node)

This node sends the execution details to your approval system.

### Configuration:
- **Method:** `POST`
- **URL:** `https://[YOUR_DOMAIN]/webhook/register` (replace with your domain from .env)
- **Authentication:** `Header Auth`
- **Credential for Header Auth:** Select `Webhook Approval API` (from Step 1)
- **Send Body:** `JSON`
- **Specify Body:** `Using JSON`

### JSON Body (COPY THIS EXACTLY):
```json
{
  "executionId": "{{ $execution.id }}",
  "resumeUrl": "{{ $execution.resumeUrl }}",
  "workflowName": "{{ $workflow.name }}",
  "data": {
    "description": "{{ $json.description || 'Approval required' }}",
    "amount": {{ $json.amount || 0 }},
    "requestor": "{{ $json.requestor || 'System' }}",
    "details": "{{ $json.details || 'No additional details' }}"
  }
}
```

### ⚠️ CRITICAL VARIABLES:
- `{{ $execution.id }}` - Unique execution identifier (n8n provides this)
- `{{ $execution.resumeUrl }}` - The webhook URL to resume the workflow (n8n generates this)
- `{{ $workflow.name }}` - Name of your workflow

## 📋 Step 3: Add Wait Node (AFTER HTTP Request)

### Configuration:
- **Resume:** `On Webhook Call`
- **HTTP Method:** `POST`
- **Response Code:** `200`
- **Respond:** `Immediately`
- **Authentication:** `None` (the approval system handles this)

### Optional Settings:
- **Limit Wait Time:** Toggle ON if you want a timeout
  - **Limit Type:** `After Time Interval`
  - **Amount:** `30`
  - **Unit:** `Minutes`

## 📋 Step 4: Add IF Node (AFTER Wait Node)

### Configuration:
- **Conditions:** Boolean
- **Value 1:** `{{ $json.approved }}`
- **Operation:** `Equal`
- **Value 2:** `true`

### Output:
- **True Branch:** Connect to your approved actions
- **False Branch:** Connect to your rejected actions

## 🔧 Complete Workflow Structure:

```
[Trigger Node]
      ↓
[HTTP Request - Register Approval]  ← Must include $execution.resumeUrl
      ↓
[Wait - On Webhook Call]           ← Pauses here until approval
      ↓
[IF - Check Approval Status]
      ↓                ↓
[Approved Path]   [Rejected Path]
```

## 🧪 Test with CURL (Replace YOUR_API_KEY):

```bash
curl -X POST https://[YOUR_DOMAIN]/webhook/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "executionId": "test-123",
    "resumeUrl": "https://webhook.site/test-url",
    "workflowName": "Test Workflow",
    "data": {
      "description": "Testing approval system",
      "amount": 1000,
      "requestor": "John Doe"
    }
  }'
```

## 🚨 Common Mistakes to Avoid:

1. **Missing $execution.resumeUrl** - This MUST be sent in the HTTP Request body
2. **Wrong node order** - HTTP Request MUST come BEFORE Wait node
3. **Missing API key** - Configure Header Auth credential first
4. **Using wrong variables** - Use `{{ $execution.resumeUrl }}` not `$resumeWebhookUrl`

## 📊 What Data the Wait Node Receives:

When approved/rejected, your Wait node will receive:
```json
{
  "approved": true/false,
  "timestamp": "2025-01-19T...",
  "approvedBy": "Manual Approval System",
  "executionId": "...",
  "workflowName": "...",
  "originalData": { ... }
}
```

## 🎯 How It Works:

1. **Workflow starts** → Trigger fires
2. **HTTP Request** → Sends execution details with `$execution.resumeUrl` to approval system
3. **Wait node** → Pauses execution, waiting for webhook call
4. **You visit** → https://carter.ngrok.app to see pending approvals
5. **You click** → Approve or Reject button
6. **System calls** → The `resumeUrl` with approval decision
7. **Workflow resumes** → IF node checks `approved` value
8. **Workflow continues** → Based on approval decision

## 🔒 Security:

- Only the registration endpoint requires API key
- Dashboard is public for easy access
- Each execution has a unique `resumeUrl` that only works once
- Cards automatically disappear after approval/rejection

## 📝 Environment Variables (.env file):

```bash
# Required - Change this in production!
API_KEY=wh-approval-key-a7f8d9e2b4c6

# Server port
PORT=3000

# Your ngrok domain
DOMAIN=your-domain.ngrok.app
```

## 🚀 Running the System:

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Start ngrok (in another terminal):**
   ```bash
   ngrok http [PORT] --domain=[YOUR_DOMAIN]
   ```
   Replace [PORT] and [YOUR_DOMAIN] with values from your .env file

3. **Access dashboard:**
   - Local: http://localhost:3000
   - Public: https://[YOUR_DOMAIN]

## ❓ Troubleshooting:

**Workflow doesn't pause:**
- Ensure Wait node is set to "On Webhook Call"
- Check that HTTP Request runs BEFORE Wait node

**No approval appears:**
- Verify `$execution.resumeUrl` is being sent
- Check API key is correct
- Look at server logs for errors

**Workflow doesn't resume:**
- Check ngrok is running
- Verify the resumeUrl is accessible
- Check n8n logs for webhook errors