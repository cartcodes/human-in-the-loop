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

### Configure Workflow

Required nodes in order:

1. **Trigger Node** (preferably a message being sent in)
2. **HTTP Request Node** - Register approval request
3. **Wait Node** - Pause for approval IMPORTANT that this is set to On Webhook Call

### Example Workflow

Here's an example workflow to pop into n8n:
[Human In The Loop Test.json](https://github.com/user-attachments/files/22437390/Human.In.The.Loop.Test.json)

Just import that to n8n and fill necessary credentials for testing purposes, I recommend setting up the legacy Lerty nodes for the originate message options.

## Troubleshooting

### Workflow doesn't pause and wait for response
- Ensure Wait node is set to "On Webhook Call"
- HTTP Request must come BEFORE Wait node

### No approval appears
- Verify `executionId` and `resumeUrl` are being sent in the originate form http request
- Check API key is correct
- Review server logs for detailed errors

### Workflow doesn't resume
- Check ngrok is running and accessible
- Verify the resumeUrl is reachable
- Check n8n logs for webhook errors

## Development

```bash
# Start in development mode
npm run dev

# Run tests (when available)
npm test
```

