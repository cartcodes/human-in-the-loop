# n8n Workflow Configuration for Human-in-the-Loop Approval

## Overview
This guide will help you set up an n8n workflow with human-in-the-loop approval using the webhook approval system.

## Step 1: Start the Approval Server

1. First, start your local server:
```bash
npm start
```

2. In a new terminal, start ngrok with your custom domain:
```bash
ngrok http 3000 --hostname=carter.ngrok.app
```

3. Your approval dashboard will be available at:
   - Local: http://localhost:3000
   - Public: https://carter.ngrok.app

## Step 2: Create n8n Workflow

### Required Nodes:

1. **Trigger Node** (e.g., Manual Trigger, Webhook, Schedule, etc.)

2. **HTTP Request Node - Register Approval**
   - Name: "Register Approval"
   - Method: POST
   - URL: `https://carter.ngrok.app/webhook/register`
   - Authentication: None
   - Send Body: JSON
   - Body Parameters:
     ```json
     {
       "executionId": "{{ $execution.id }}",
       "resumeUrl": "{{ $execution.resumeUrl }}",
       "workflowName": "{{ $workflow.name }}",
       "data": {
         // Add any custom data you want to display in the approval interface
         "description": "Your approval description",
         "amount": 1000,
         "requestor": "John Doe"
       }
     }
     ```

3. **Wait Node**
   - Resume: On Webhook Call
   - Options:
     - Timeout: Set as needed (e.g., 3600 seconds for 1 hour)
     - Default Response: What happens if timeout occurs

4. **IF Node - Check Approval**
   - Conditions:
     - Value 1: `{{ $json.approved }}`
     - Operation: Equal
     - Value 2: true

5. **Approved Branch** - Add your approved workflow logic

6. **Rejected Branch** - Add your rejected workflow logic

## Step 3: Example Complete Workflow

```
[Manual Trigger]
        ↓
[HTTP Request - Register Approval]
        ↓
[Wait for Webhook]
        ↓
[IF - Check Approval Status]
        ↓                    ↓
[Approved Actions]    [Rejected Actions]
```

## Step 4: Testing the Workflow

1. Execute your n8n workflow
2. Open the approval dashboard at https://carter.ngrok.app
3. You should see the pending approval card
4. Click "Approve" or "Reject"
5. The n8n workflow will continue based on your decision

## Key Points:

- The `$execution.resumeUrl` is automatically provided by n8n in Wait nodes
- The approval system will POST back to this URL with the approval decision
- The dashboard auto-refreshes every 5 seconds to show new approvals
- All approvals are stored in memory (restart clears them)

## Troubleshooting:

1. **Workflow doesn't resume after approval:**
   - Check that ngrok is running and accessible
   - Verify the resumeUrl is being sent correctly
   - Check n8n logs for any errors

2. **Approval doesn't show in dashboard:**
   - Ensure the HTTP Request node is sending all required fields
   - Check server logs for any errors
   - Verify ngrok is forwarding to the correct port (3000)

3. **Timeout issues:**
   - Increase the timeout in the Wait node
   - Ensure approvals are processed before timeout

## Advanced Usage:

### Multiple Approval Levels
You can chain multiple approval steps by adding more HTTP Request + Wait node combinations.

### Custom Data Display
Modify the `data` field in the HTTP Request to send any information you want displayed in the approval card.

### Integration with Other Services
The approval system exposes a REST API that can be integrated with other tools beyond n8n.