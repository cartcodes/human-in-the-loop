const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const DOMAIN = process.env.DOMAIN || 'localhost';

// Validate API key is set
if (!API_KEY) {
  console.error('ERROR: API_KEY not set in environment variables');
  console.error('Please create a .env file with API_KEY=your-secure-key');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Store pending approvals in memory (in production, use a database)
const pendingApprovals = new Map();

// Store test webhook responses
const testWebhookResponses = new Map();

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Please provide X-API-Key header or Authorization header'
    });
  }

  // Remove 'Bearer ' prefix if present
  const cleanKey = apiKey.replace(/^Bearer\s+/i, '');

  if (cleanKey !== API_KEY) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key'
    });
  }

  next();
};

// Webhook endpoint that n8n will call to register a wait (protected with API key)
app.post('/webhook/register', authenticateApiKey, (req, res) => {
  const { executionId, resumeUrl, workflowName, data } = req.body;

  // Enhanced error handling for missing required fields
  if (!executionId || !resumeUrl) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Both executionId and resumeUrl are required fields',
      required: ['executionId', 'resumeUrl'],
      received: {
        executionId: executionId ? 'provided' : 'missing',
        resumeUrl: resumeUrl ? 'provided' : 'missing'
      }
    });
  }

  // Validate data structure if elements are provided
  if (data && data.elements) {
    if (!Array.isArray(data.elements)) {
      return res.status(400).json({
        error: 'Invalid data structure',
        message: 'data.elements must be an array when provided',
        received: typeof data.elements
      });
    }

    // Track action types for validation
    let hasBoolean = false;
    let hasButtons = false;
    let hasForm = false;
    let actionCount = 0;

    // Validate each element
    for (let i = 0; i < data.elements.length; i++) {
      const element = data.elements[i];

      if (!element.type) {
        return res.status(400).json({
          error: 'Invalid element',
          message: `Element at index ${i} is missing required property: type`,
          validTypes: ['title', 'message', 'boolean', 'buttons', 'form']
        });
      }

      // Track action types
      if (element.type === 'boolean') {
        hasBoolean = true;
        actionCount++;
      } else if (element.type === 'buttons') {
        hasButtons = true;
        actionCount++;
      } else if (element.type === 'form') {
        hasForm = true;
      }

      // Validate only one action type is present
      if ((hasBoolean && hasButtons) || (hasBoolean && hasForm) || (hasButtons && hasForm)) {
        return res.status(400).json({
          error: 'Multiple action types detected',
          message: 'Only one action type (boolean, buttons, or form fields) can be used per approval',
          detected: {
            boolean: hasBoolean,
            buttons: hasButtons,
            form: hasForm
          },
          suggestion: 'Remove conflicting action elements and use only one type'
        });
      }

      // Validate specific element types
      switch (element.type) {
        case 'title':
        case 'message':
          if (!element.text) {
            return res.status(400).json({
              error: 'Invalid element',
              message: `${element.type} element at index ${i} is missing required property: text`
            });
          }
          break;

        case 'buttons':
          if (!element.options || !Array.isArray(element.options) || element.options.length === 0) {
            return res.status(400).json({
              error: 'Invalid buttons element',
              message: `Buttons element at index ${i} must have a non-empty options array`
            });
          }
          // Check for duplicate buttons elements
          if (data.elements.filter(e => e.type === 'buttons').length > 1) {
            return res.status(400).json({
              error: 'Duplicate buttons element',
              message: 'Only one buttons element is allowed per approval',
              suggestion: 'Combine all button options into a single buttons element'
            });
          }
          break;

        case 'form':
          if (!element.name) {
            return res.status(400).json({
              error: 'Invalid form field',
              message: `Form field at index ${i} is missing required property: name`
            });
          }
          if (!element.fieldType) {
            return res.status(400).json({
              error: 'Invalid form field',
              message: `Form field '${element.name}' is missing required property: fieldType`,
              validFieldTypes: ['text', 'number', 'select', 'multiselect']
            });
          }
          if ((element.fieldType === 'select' || element.fieldType === 'multiselect') && (!element.options || !Array.isArray(element.options))) {
            return res.status(400).json({
              error: 'Invalid form field',
              message: `${element.fieldType === 'multiselect' ? 'Multi-select' : 'Select'} field '${element.name}' must have an options array`
            });
          }
          break;

        case 'boolean':
          // Check for duplicate boolean elements
          if (data.elements.filter(e => e.type === 'boolean').length > 1) {
            return res.status(400).json({
              error: 'Duplicate boolean element',
              message: 'Only one boolean element is allowed per approval',
              suggestion: 'Remove duplicate boolean elements'
            });
          }
          break;

        default:
          return res.status(400).json({
            error: 'Invalid element type',
            message: `Unknown element type '${element.type}' at index ${i}`,
            validTypes: ['title', 'message', 'boolean', 'buttons', 'form']
          });
      }
    }
  }

  // Validate resumeUrl format
  try {
    new URL(resumeUrl);
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid resumeUrl',
      message: 'resumeUrl must be a valid URL',
      example: 'https://your-n8n-instance.com/webhook/...',
      received: resumeUrl
    });
  }

  const approval = {
    id: executionId,
    resumeUrl,
    workflowName: workflowName || 'Unknown Workflow',
    data: data || {},
    timestamp: new Date(),
    status: 'pending'
  };

  pendingApprovals.set(executionId, approval);

  console.log(`New approval request registered: ${executionId}`);
  console.log(`Resume URL: ${resumeUrl}`);
  console.log(`Data structure:`, JSON.stringify(data, null, 2));

  res.json({
    success: true,
    message: 'Approval request registered successfully',
    executionId,
    approvalUrl: `${req.protocol}://${req.get('host')}/approve.html?id=${executionId}`,
    dashboardUrl: `${req.protocol}://${req.get('host')}`,
    timestamp: new Date().toISOString()
  });
});

// Get all pending approvals
app.get('/api/approvals', (req, res) => {
  const approvals = Array.from(pendingApprovals.values())
    .filter(a => a.status === 'pending')
    .sort((a, b) => b.timestamp - a.timestamp);
  res.json(approvals);
});

// Get specific approval
app.get('/api/approvals/:id', (req, res) => {
  const approval = pendingApprovals.get(req.params.id);
  if (!approval) {
    return res.status(404).json({ error: 'Approval not found' });
  }
  res.json(approval);
});

// Process approval/rejection
app.post('/api/approve/:id', async (req, res) => {
  const { approved, response, formData } = req.body;
  const approval = pendingApprovals.get(req.params.id);

  if (!approval) {
    return res.status(404).json({
      error: 'Approval not found',
      message: `No approval found with ID: ${req.params.id}`,
      suggestion: 'The approval may have expired or already been processed'
    });
  }

  if (approval.status !== 'pending') {
    return res.status(400).json({
      error: 'Approval already processed',
      message: `This approval was already ${approval.status}`,
      processedAt: approval.processedAt,
      status: approval.status
    });
  }

  // Validate response data based on approval type
  const elements = approval.data?.elements || [];
  const hasBoolean = elements.some(e => e.type === 'boolean');
  const hasButtons = elements.some(e => e.type === 'buttons');
  const hasForm = elements.some(e => e.type === 'form');

  if (hasBoolean && approved === undefined) {
    return res.status(400).json({
      error: 'Invalid response',
      message: 'Boolean approval requires "approved" field (true/false)',
      expected: { approved: 'boolean' }
    });
  }

  if (hasButtons && !response) {
    return res.status(400).json({
      error: 'Invalid response',
      message: 'Button selection requires "response" field',
      expected: { response: 'string' }
    });
  }

  if (hasForm && !formData) {
    return res.status(400).json({
      error: 'Invalid response',
      message: 'Form submission requires "formData" object',
      expected: { formData: 'object' }
    });
  }

  try {
    // Call n8n's resume URL with the approval decision
    // n8n Wait node expects the data in the body directly
    const fetch = (await import('node-fetch')).default;

    // Prepare the response data that n8n will receive
    let responseData = {
      timestamp: new Date().toISOString(),
      approvedBy: 'Manual Approval System',
      executionId: approval.id,
      workflowName: approval.workflowName,
      originalData: approval.data
    };

    // Add the appropriate response based on type
    if (approved !== undefined) {
      responseData.approved = approved;
    }
    if (response !== undefined) {
      responseData.response = response;
    }
    if (formData !== undefined) {
      responseData.formData = formData;
    }

    console.log(`\n=== WEBHOOK CALL ATTEMPT ===`);
    console.log(`Calling resume URL: ${approval.resumeUrl}`);
    console.log(`Request method: POST`);
    console.log(`Request headers: Content-Type: application/json`);
    console.log(`Request body:`, JSON.stringify(responseData, null, 2));
    console.log(`===========================\n`);

    const httpResponse = await fetch(approval.resumeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData)
    });

    const responseText = await httpResponse.text();
    console.log(`\n=== WEBHOOK RESPONSE ===`);
    console.log(`Response status: ${httpResponse.status} ${httpResponse.statusText}`);
    console.log(`Response headers:`, Object.fromEntries(httpResponse.headers.entries()));
    console.log(`Response body: ${responseText}`);
    console.log(`========================\n`);

    // Handle specific n8n status codes
    if (httpResponse.status === 409) {
      // Execution already finished - this is not really an error from user perspective
      console.log('⚠️  WARNING: Workflow execution already finished or timed out');
      console.log('This usually means the Wait node timeout was reached before approval.');
    } else if (httpResponse.status === 404) {
      console.error('❌ ERROR: Resume URL not found (404)');
      console.error('Possible causes:');
      console.error('  1. The workflow execution was manually stopped');
      console.error('  2. The resumeUrl is incorrect');
      console.error('  3. n8n was restarted and lost the execution state');
      throw new Error(`Resume URL not found: ${responseText}`);
    } else if (!httpResponse.ok) {
      console.error(`❌ ERROR: Webhook call failed with status ${httpResponse.status}`);
      console.error(`Response: ${responseText}`);
      throw new Error(`Webhook responded with status ${httpResponse.status}: ${responseText}`);
    } else {
      console.log('✅ SUCCESS: Webhook call completed successfully');
    }

    // Update approval status
    approval.status = approved ? 'approved' : 'rejected';
    approval.processedAt = new Date();

    res.json({
      success: true,
      message: `Workflow ${approved ? 'approved' : 'rejected'} successfully`,
      approval,
      n8nResponse: responseText
    });

    console.log(`Approval ${req.params.id} was ${approved ? 'approved' : 'rejected'}`);

  } catch (error) {
    console.error('\n=== ERROR PROCESSING APPROVAL ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code || 'N/A');

    if (error.cause) {
      console.error('Error cause:', error.cause);
    }

    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    console.error('Approval details:');
    console.error('  - Execution ID:', approval.id);
    console.error('  - Resume URL:', approval.resumeUrl);
    console.error('  - Workflow:', approval.workflowName);
    console.error('==================================\n');

    // Provide more detailed error information
    const errorResponse = {
      error: 'Failed to process approval',
      message: error.message
    };

    if (error.code === 'ECONNREFUSED') {
      errorResponse.message = 'Cannot connect to n8n webhook URL';
      errorResponse.suggestion = 'Ensure n8n is running and the resumeUrl is accessible';
    } else if (error.code === 'ETIMEDOUT') {
      errorResponse.message = 'Connection to n8n timed out';
      errorResponse.suggestion = 'Check network connectivity and n8n availability';
    } else if (error.message.includes('fetch')) {
      errorResponse.message = 'Network error when calling n8n';
      errorResponse.suggestion = 'Verify the resumeUrl is correct and accessible';
    }

    res.status(500).json(errorResponse);
  }
});

// Clear old approvals (cleanup)
app.delete('/api/approvals/clear', (req, res) => {
  const cleared = pendingApprovals.size;
  pendingApprovals.clear();
  res.json({ success: true, cleared });
});

// Test webhook endpoint - receives the webhook response for testing
app.post('/test/webhook/:id', (req, res) => {
  const testId = req.params.id;
  const body = req.body;

  console.log(`\n=== TEST WEBHOOK RECEIVED ===`);
  console.log(`Test ID: ${testId}`);
  console.log(`Request body:`, JSON.stringify(body, null, 2));
  console.log(`=============================\n`);

  // Store the response
  testWebhookResponses.set(testId, {
    timestamp: new Date(),
    data: body,
    headers: req.headers
  });

  // Respond like n8n would
  res.status(200).json({
    success: true,
    message: 'Test webhook received',
    executionId: body.executionId,
    received: body
  });
});

// Get test webhook response
app.get('/test/webhook/:id', (req, res) => {
  const testId = req.params.id;
  const response = testWebhookResponses.get(testId);

  if (!response) {
    return res.status(404).json({
      error: 'No test response found',
      message: `No webhook has been received for test ID: ${testId}`
    });
  }

  res.json(response);
});

// Create test approval with generated resume URL
app.post('/test/create', (req, res) => {
  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const testResumeUrl = `${baseUrl}/test/webhook/${testId}`;

  const { elements, workflowName } = req.body;

  // Create the approval request
  const approval = {
    id: testId,
    resumeUrl: testResumeUrl,
    workflowName: workflowName || 'Test Sandbox Workflow',
    data: { elements: elements || [] },
    timestamp: new Date(),
    status: 'pending'
  };

  pendingApprovals.set(testId, approval);

  console.log(`\n=== TEST APPROVAL CREATED ===`);
  console.log(`Test ID: ${testId}`);
  console.log(`Test Resume URL: ${testResumeUrl}`);
  console.log(`Elements:`, JSON.stringify(elements, null, 2));
  console.log(`=============================\n`);

  // Return the curl command and approval details
  const curlCommand = `curl -X POST ${baseUrl}/webhook/register \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${API_KEY}" \\
  -d '${JSON.stringify({
    executionId: testId,
    resumeUrl: testResumeUrl,
    workflowName: workflowName || 'Test Sandbox Workflow',
    data: { elements: elements || [] }
  }, null, 2)}'`;

  res.json({
    success: true,
    testId,
    approvalUrl: `${baseUrl}/#test-${testId}`,
    resumeUrl: testResumeUrl,
    statusUrl: `${baseUrl}/test/webhook/${testId}`,
    curlCommand,
    message: 'Test approval created. Visit the dashboard to approve/reject, then check statusUrl for the webhook response.'
  });
});

app.listen(port, () => {
  console.log('====================================');
  console.log(`Webhook approval server running on port ${port}`);
  console.log(`Dashboard: http://localhost:${port}`);
  console.log('====================================');
  console.log('API Authentication Enabled:');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log('Use header: X-API-Key or Authorization');
  console.log('====================================');
  console.log('Test Endpoints:');
  console.log(`POST /test/create - Create test approval`);
  console.log(`GET  /test/webhook/:id - Check test webhook response`);
  console.log('====================================');
  console.log(`\nWaiting for ngrok to start...`);
  console.log(`Run: ngrok http ${port} --domain=${DOMAIN}`);
});