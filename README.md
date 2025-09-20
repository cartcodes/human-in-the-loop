[Human In The Loop Test.json](https://github.com/user-attachments/files/22437390/Human.In.The.Loop.Test.json)# Webhook Approval System

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
[Uploading H{
  "name": "Human In The Loop Test",
  "nodes": [
    {
      "parameters": {
        "promptType": "define",
        "text": "=<response>\n{{ $json.body.content }}\n<response>\n\n<approval>\n{{ $json.body.approved }}\n</approval>",
        "hasOutputParser": true,
        "options": {
          "systemMessage": "Instructions\nAlways respond using the Output Structure. No deviations. Do not emit any text outside the Output Structure. Never return raw inner JSON without the wrapper.\n\nInputs:\n<response> carries a request, revision feedback, or a signal that it is ready to post.\n<approval>false</approval> is only valid after a boolean response and means the confirmation was rejected; return a revised send draft.\n\nBehavior:\nIf <response> requests a draft → respond with response-type:\"send\" and a feedback-oriented draft.\nIf <response> contains revision feedback → respond with response-type:\"send\" and a revised draft that ends with a feedback question.\nIf <response> signals readiness to post (e.g., “post this”, “looks good”, “ready to go”, “ship it”) → respond with response-type:\"boolean\" and the confirmation JSON block.\nIf <approval>false</approval> follows a boolean → revise the last draft and respond with response-type:\"send\".\nSend drafts must always end with a feedback question.\nBoolean confirmation must follow the exact element schema, and elements[1].text must contain only the final post text, with no labels or quotes.\nNo empty responses.\n\nOutput Structure\n{\n\"response-type\": \"\",\n\"response\": \"\"\n}\n\nresponse-type:\n\"send\" for drafts and revisions.\n\"boolean\" for posting confirmation.\n\nresponse:\nFor \"send\": the draft or revision text that asks for feedback.\nFor \"boolean\": a JSON object:\n{\n\"elements\": [\n{ \"type\": \"title\", \"text\": \"Do you like what you see? Should I post it?\" },\n{ \"type\": \"message\", \"text\": \"<POST TEXT ONLY. NO PREFIX. NO QUOTES.>\" },\n{ \"type\": \"boolean\" }\n]\n}\n\nExamples\n\nDraft request\nInput:\n<response>\nWrite a post about productivity hacks\n</response>\nOutput:\n{\n\"response-type\": \"send\",\n\"response\": \"Here is a draft: Boost your focus by batching similar tasks, blocking distractions in timed sprints, and taking short recovery breaks. Do you want a more casual tone or more specific tactics?\"\n}\n\nUser says it is ready to post\nInput:\n<response>\nThis looks good, post it\n</response>\nOutput:\n{\n\"response-type\": \"boolean\",\n\"response\": {\n\"elements\": [\n{ \"type\": \"title\", \"text\": \"Do you like what you see? Should I post it?\" },\n{ \"type\": \"message\", \"text\": \"Boost your focus by batching similar tasks, blocking distractions in timed sprints, and taking short recovery breaks.\" },\n{ \"type\": \"boolean\" }\n]\n}\n}\n\nRejection after boolean\nInput:\n<approval>\nfalse\n</approval>\nOutput:\n{\n\"response-type\": \"send\",\n\"response\": \"Revision: Want more output with less stress? Group similar tasks, mute distractions in short sprints, then take quick resets to recover focus. Should I make this shorter or add an example?\"\n}\n\nRevision feedback\nInput:\n<response>\nMake it more casual\n</response>\nOutput:\n{\n\"response-type\": \"send\",\n\"response\": \"Casual take: Want to get more done without burning out? Group your tasks, work in short focused bursts, then take quick breathers to reset. Is this casual enough or should I punch it up more?\"\n}\n\nCoffee example matching your requirement\nInput:\n<response>\nThis is ready to post\n</response>\nOutput:\n{\n\"response-type\": \"boolean\",\n\"response\": {\n\"elements\": [\n{ \"type\": \"title\", \"text\": \"Do you like what you see? Should I post it?\" },\n{ \"type\": \"message\", \"text\": \"Choosing the right coffee beans starts with deciding what flavors you enjoy: fruity and bright (often from East Africa), chocolatey and nutty (Central or South America), or earthy and spicy (Indonesia). Match roast level to your brew - light roasts highlight origin and acidity, medium roasts offer balance, and dark roasts bring body and bittersweet notes. Pay attention to processing: washed for clean bright cups, natural or honey for fruitier profiles. Buy whole beans roasted within the last 2-4 weeks and grind just before brewing; store them in a cool airtight container away from light and heat. Finally, choose beans suited to your method - pour over and drip often shine with single origin light to medium roasts, while espresso and French press can work well with medium to dark roasts or blends. Try small bags from local roasters to explore different origins and roasts until you find your favorites.\" },\n{ \"type\": \"boolean\" }\n]\n}\n}"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [
        448,
        -112
      ],
      "id": "1a444f8c-a664-4e90-835a-5ff37b0f0f88",
      "name": "Post Creator"
    },
    {
      "parameters": {
        "resume": "webhook",
        "httpMethod": "POST",
        "options": {}
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        1216,
        -96
      ],
      "id": "6d235b7e-b680-4a31-94b7-53c2a3cde339",
      "name": "Wait",
      "webhookId": "1f9294f1-a698-4af2-884a-619071ef11ac"
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "value": "gpt-5-mini",
          "mode": "list",
          "cachedResultName": "gpt-5-mini"
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [
        304,
        224
      ],
      "id": "139949a2-ed9a-4e48-b626-5de73afb1a7a",
      "name": "OpenAI Chat Model",
      "credentials": {
        "openAiApi": {
          "id": "ApUjrvX6HkYOfoa0",
          "name": "Test Lerty"
        }
      }
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "={{ $('Receive User Inputs').item.json.body.conversation_id }}",
        "contextWindowLength": 20
      },
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [
        464,
        208
      ],
      "id": "409ca92d-a9f7-4e80-bbfa-bababd6ce40b",
      "name": "Simple Memory"
    },
    {
      "parameters": {
        "schemaType": "manual",
        "inputSchema": "{\n  \"response-type\":\"\",\n  \"response\":\"\"\n}"
      },
      "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
      "typeVersion": 1.3,
      "position": [
        624,
        208
      ],
      "id": "eff7af21-e8c8-42ad-b0d9-962139c867ff",
      "name": "Structured Output Parser"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "9ed797f1-d03b-451e-b5fb-c1512202de9c",
              "leftValue": "={{ $json.body.approved }}",
              "rightValue": "",
              "operator": {
                "type": "boolean",
                "operation": "true",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        1392,
        -96
      ],
      "id": "95f14fe7-ffed-4052-8e1e-fdf06a422b5b",
      "name": "Approval"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://lerty.ai/api/v1/conversations/{{ $('Receive User Inputs').item.json.body.conversation_id }}/originate",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "ADD-KEY-HERE"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "content",
              "value": "={{ $('Post Creator').item.json.output.response }}"
            },
            {
              "name": "external_message_id",
              "value": "="
            },
            {
              "name": "role",
              "value": "agent"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1040,
        -336
      ],
      "id": "c16d07ea-f491-4e4d-a84a-23522a9b3056",
      "name": "Originate Message"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "7010edde-a0a8-44b0-bf4b-031af60407eb",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        208,
        -112
      ],
      "id": "773af8a6-c0f6-401a-b9a8-e27a23e395c1",
      "name": "Receive User Inputs",
      "webhookId": "7010edde-a0a8-44b0-bf4b-031af60407eb"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://carter.ngrok.app/webhook/register",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "ADD-KEY-HERE"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"executionId\": \"{{ $execution.id }}\",\n  \"resumeUrl\": \"{{ $execution.resumeUrl }}\",\n  \"workflowName\": \"{{ $workflow.name }}\",\n  \"data\": {\n    \"elements\": [\n      {\n        \"type\": \"title\",\n        \"text\": \"What is your favorite ice cream?\"\n      },\n      {\n        \"type\": \"message\",\n        \"text\": \"Choose only one!\"\n      },\n      {\n        \"type\": \"message\",\n        \"text\": \"New message text\"\n      },\n      {\n        \"type\": \"message\",\n        \"text\": \"New message text\"\n      },\n      {\n        \"type\": \"form\",\n        \"name\": \"field_1758330037325\",\n        \"label\": \"NAME\",\n        \"fieldType\": \"text\",\n        \"required\": false\n      },\n      {\n        \"type\": \"form\",\n        \"name\": \"field_1758330066944\",\n        \"label\": \"Rating\",\n        \"fieldType\": \"number\",\n        \"required\": false\n      },\n      {\n        \"type\": \"form\",\n        \"name\": \"field_1758330079834\",\n        \"label\": \"Role\",\n        \"fieldType\": \"select\",\n        \"required\": false,\n        \"options\": [\n          \"CEO\",\n          \"Manager\",\n          \"Employee\"\n        ]\n      }\n    ]\n  }\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1040,
        -96
      ],
      "id": "c60b3668-06ab-4367-8cf7-ee0c98152102",
      "name": "Originate Form Message"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "send",
                    "rightValue": "={{ $json.output[\"response-type\"] }}",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "14e83328-e9aa-42d2-9597-ea5695a65526"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Send Message"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "1706eb56-13e6-4b58-be2f-dafdcb36b021",
                    "leftValue": "boolean",
                    "rightValue": "={{ $json.output[\"response-type\"] }}",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Approve or Deny"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        752,
        -112
      ],
      "id": "b49eeb2e-41c5-4888-b4a2-40e4b998b933",
      "name": "Switch"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://lerty.ai/api/v1/conversations/{{ $('Receive User Inputs').item.json.body.conversation_id }}/originate",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer ADD-KEY-HERE"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "content",
              "value": "=✅Posted:{{ $('Post Creator').item.json.output.response.elements[1].text }}"
            },
            {
              "name": "external_message_id",
              "value": "="
            },
            {
              "name": "role",
              "value": "agent"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1600,
        -112
      ],
      "id": "023e63ba-250e-4cc1-b3a7-92547768a656",
      "name": "Originate Message (Posted)"
    }
  ],
  "pinData": {},
  "connections": {
    "Post Creator": {
      "main": [
        [
          {
            "node": "Switch",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "Post Creator",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        [
          {
            "node": "Post Creator",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "Structured Output Parser": {
      "ai_outputParser": [
        [
          {
            "node": "Post Creator",
            "type": "ai_outputParser",
            "index": 0
          }
        ]
      ]
    },
    "Wait": {
      "main": [
        [
          {
            "node": "Approval",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Approval": {
      "main": [
        [
          {
            "node": "Originate Message (Posted)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Post Creator",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Originate Message": {
      "main": [
        []
      ]
    },
    "Receive User Inputs": {
      "main": [
        [
          {
            "node": "Post Creator",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Originate Form Message": {
      "main": [
        [
          {
            "node": "Wait",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch": {
      "main": [
        [
          {
            "node": "Originate Message",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Originate Form Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "3bd04b17-fcee-4e10-b57a-ad7344742bac",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "8e09c051f262ebcc879c516591c0a20946ed53132c6bab37c94c646c48bfb3aa"
  },
  "id": "AaBBYZ5qz2Ysweak",
  "tags": []
}uman In The Loop Test.json…]()


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
