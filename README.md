# Webhook Approval System

A comprehensive human-in-the-loop approval system for n8n workflows with visual form builder, sandbox testing, and support for multiple response types.

## Features

- **Visual Form Builder**: Drag-and-drop interface to design approval forms
- **Multiple Response Types**: Boolean (approve/reject), custom buttons, and form fields
- **Sandbox Testing**: Test approval flows without n8n integration
- **Real-time Dashboard**: Live updates showing pending and completed approvals
- **Clean UI**: Modern dark theme with smooth animations and intuitive design
- **API Security**: API key authentication for webhook registration
- **Smart Validation**: Enforces single action type per approval (no conflicts)
- **Field Types**: Text, number, single-select, and multi-select fields
- **Rich Content**: Support for multiple titles and messages per approval

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Create a `.env` file:

```bash
# Required - Change this in production!
API_KEY=your-secure-api-key-here

# Server port (defaults to 3000)
PORT=3000

# Public domain for ngrok (e.g., your-domain.ngrok.app)
DOMAIN=your-domain.ngrok.app
```

### 3. Start the Server

```bash
npm start
```

### 4. Start Ngrok (for public access)

```bash
ngrok http 3000 --domain=your-domain.ngrok.app
```

Note: Replace the port and domain with your values from .env

### 5. Access Dashboard

- Local: http://localhost:3000
- Public: https://your-domain.ngrok.app

## n8n Integration

### Step 1: Create Header Auth Credential

1. In n8n, go to **Credentials** → **Create New** → **Header Auth**
2. Configure:
   - **Name:** `Webhook Approval API`
   - **Header Name:** `X-API-Key`
   - **Header Value:** Your API key from .env file

### Step 2: Configure Workflow

Required nodes in order:

1. **Trigger Node** (any type)
2. **HTTP Request Node** - Register approval request
3. **Wait Node** - Pause for approval
4. **IF Node** - Check approval decision
5. **Action Nodes** - Based on approval/rejection

### Step 3: HTTP Request Node Configuration

- **Method:** `POST`
- **URL:** `https://[YOUR_DOMAIN]/webhook/register` (use domain from .env)
- **Authentication:** `Header Auth` (select your credential)
- **Send Body:** `JSON`

## System Architecture

### Pages

1. **Live Dashboard** (`/`) - View and respond to real approval requests
2. **Sandbox Builder** (`/sandbox.html`) - Visual form builder with drag-and-drop
3. **Documentation** (`/#docs`) - Comprehensive API and usage documentation

## Sandbox Builder

The Sandbox Builder (`/sandbox.html`) provides a visual interface for creating approval forms:

1. **Select Action Type**: Choose between Boolean, Custom Buttons, or Form Fields
2. **Add Elements**: Add titles, messages, and action elements
3. **Drag & Drop**: Reorder elements by dragging
4. **Edit Elements**: Click edit to modify properties
5. **Live Preview**: See how your form will appear in real-time
6. **JSON Output**: Copy the generated JSON for n8n integration
7. **Create Test**: Generate a sandbox test to see it in the Live dashboard

### Sandbox Tests

- Sandbox tests appear in the Live dashboard with a red "SANDBOX TEST" badge
- They have a red left border to distinguish from real approvals
- Test webhooks are captured at `/test/webhook/:id` for verification
- Perfect for testing approval flows without n8n

## API Documentation

### Register Approval Endpoint

**POST** `/webhook/register`

**Headers:**
- `X-API-Key` or `Authorization`: Your API key
- `Content-Type`: application/json

**Required Fields:**
```json
{
  "executionId": "{{ $execution.id }}",
  "resumeUrl": "{{ $execution.resumeUrl }}",
  "workflowName": "{{ $workflow.name }}",
  "data": { /* Your content */ }
}
```

### Response Types

#### 1. Boolean Approval (Default)

Simple approve/reject buttons:

```json
{
  "executionId": "{{ $execution.id }}",
  "resumeUrl": "{{ $execution.resumeUrl }}",
  "workflowName": "{{ $workflow.name }}",
  "data": {
    "elements": [
      {"type": "title", "text": "Approval Required"},
      {"type": "message", "text": "Please approve this request"},
      {"type": "boolean"}
    ]
  }
}
```

**Response format:** `{ "approved": true/false }`

#### 2. Custom Buttons

Multiple choice options:

```json
{
  "executionId": "{{ $execution.id }}",
  "resumeUrl": "{{ $execution.resumeUrl }}",
  "workflowName": "{{ $workflow.name }}",
  "data": {
    "elements": [
      {"type": "title", "text": "Priority Selection"},
      {"type": "message", "text": "Choose priority level"},
      {"type": "buttons", "options": ["High", "Medium", "Low", "Skip"]}
    ]
  }
}
```

**Response format:** `{ "response": "Selected Option" }`

#### 3. Form Fields

Collect structured data:

```json
{
  "executionId": "{{ $execution.id }}",
  "resumeUrl": "{{ $execution.resumeUrl }}",
  "workflowName": "{{ $workflow.name }}",
  "data": {
    "elements": [
      {"type": "title", "text": "User Information"},
      {"type": "message", "text": "Complete the form below"},
      {
        "type": "form",
        "name": "username",
        "label": "Username",
        "fieldType": "text",
        "required": true
      },
      {
        "type": "form",
        "name": "email",
        "label": "Email Address",
        "fieldType": "email",
        "required": true
      },
      {
        "type": "form",
        "name": "department",
        "label": "Department",
        "fieldType": "select",
        "options": ["Engineering", "Sales", "Marketing"],
        "required": true
      },
      {
        "type": "form",
        "name": "notes",
        "label": "Additional Notes",
        "fieldType": "textarea",
        "required": false
      }
    ]
  }
}
```

**Response format:** `{ "formData": { "field1": "value1", ... } }`

### Element Types

| Element Type | Purpose | Properties |
|-------------|---------|------------|
| `title` | Display heading | `text` (string) |
| `message` | Display body text | `text` (string) |
| `boolean` | Show approve/reject buttons | None |
| `buttons` | Show custom buttons | `options` (array of strings) |
| `form` | Add form field | `name`, `label`, `fieldType`, `required`, `options` (for select) |

### Form Field Types

| Field Type | Description | Properties | UI Display |
|-----------|-------------|------------|------------|
| `text` | Single line text input | `required` (boolean) | Standard input field |
| `number` | Numeric input only | `required` (boolean) | Number input with arrows |
| `select` | Single selection dropdown | `options` (array), `required` | Dropdown with "Select..." placeholder |
| `multiselect` | Multiple selection list | `options` (array), `required` | List box showing 4 items, Ctrl/Cmd to multi-select |

## Error Handling

The system provides detailed error messages for common issues:

### Missing Required Fields
```json
{
  "error": "Missing required fields",
  "message": "executionId and resumeUrl are required",
  "required": ["executionId", "resumeUrl"]
}
```

### Invalid Data Structure
```json
{
  "error": "Invalid data structure",
  "message": "data.elements must be an array when provided"
}
```

### Invalid Form Configuration
```json
{
  "error": "Invalid form field",
  "message": "Form field 'email' is missing required property: name"
}
```

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "API key required. Please provide X-API-Key header"
}
```

## Complete n8n Workflow Example

```
[Manual Trigger]
        ↓
[HTTP Request - Register Approval]  ← Sends to approval system
        ↓
[Wait - On Webhook Call]           ← Pauses until approved/rejected
        ↓
[IF - Check Approval Status]       ← Checks $json.approved
        ↓                ↓
[Approved Path]    [Rejected Path]
```

### Wait Node Configuration

- **Resume:** `On Webhook Call`
- **HTTP Method:** `POST`
- **Response Code:** `200`
- **Respond:** `Immediately`
- **Limit Wait Time:** Optional (e.g., 30 minutes)

### IF Node Configuration

- **Conditions:** Boolean
- **Value 1:** `{{ $json.approved }}` (for boolean) or `{{ $json.response }}` (for buttons)
- **Operation:** `Equal`
- **Value 2:** `true` (for boolean) or specific button value

## Response Data Structure

When approved/rejected, the Wait node receives:

```json
{
  "approved": true,              // For boolean type
  "response": "High",            // For buttons type
  "formData": { ... },          // For form type
  "timestamp": "2025-01-19T...",
  "approvedBy": "Manual Approval System",
  "executionId": "...",
  "workflowName": "...",
  "originalData": { ... }
}
```

## Testing

### Test with cURL

```bash
# Test boolean approval
curl -X POST http://localhost:3000/webhook/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "executionId": "test-123",
    "resumeUrl": "http://localhost:3000/test",
    "workflowName": "Test Workflow",
    "data": {
      "elements": [
        {"type": "title", "text": "Test Approval"},
        {"type": "message", "text": "This is a test"},
        {"type": "boolean"}
      ]
    }
  }'
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/webhook/register` | POST | Required | Register new approval request |
| `/api/approvals` | GET | No | Get all pending approvals |
| `/api/approvals/:id` | GET | No | Get specific approval |
| `/api/approve/:id` | POST | No | Process approval decision |
| `/api/approvals/clear` | DELETE | No | Clear all approvals |

## Security Notes

- API key is required only for registering new approvals
- Each execution has a unique `resumeUrl` that works only once
- Dashboard is intentionally public for easy access
- In production, use strong API keys and HTTPS

## Troubleshooting

### Workflow doesn't pause
- Ensure Wait node is set to "On Webhook Call"
- HTTP Request must come BEFORE Wait node

### No approval appears
- Verify `executionId` and `resumeUrl` are being sent
- Check API key is correct
- Review server logs for detailed errors

### Workflow doesn't resume
- Check ngrok is running and accessible
- Verify the resumeUrl is reachable
- Check n8n logs for webhook errors

### Form validation issues
- Ensure required fields have the `required: true` property
- Check that select fields include an `options` array
- Verify field names are unique within a form

## Development

```bash
# Start in development mode
npm run dev

# Run tests (when available)
npm test
```

## License

ISC

## Support

For issues or questions, please check the server logs which provide detailed error information for debugging.