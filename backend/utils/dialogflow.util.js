const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');


const sessionClient = new dialogflow.SessionsClient({
  keyFilename: path.join(__dirname, '../dialogflow-key.json')
});

const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID;

const valueToJs = (value) => {
  if (!value) return null;
  if (value.listValue) return value.listValue.values.map(valueToJs);
  if (value.structValue) return structToJs(value.structValue);
  if (value.stringValue !== undefined && value.stringValue !== '') return value.stringValue;
  if (value.numberValue !== undefined) return value.numberValue;
  if (value.boolValue !== undefined) return value.boolValue;
  return value.stringValue ?? null;
};

const structToJs = (struct) => {
  if (!struct?.fields) return {};
  const obj = {};
  for (const [key, val] of Object.entries(struct.fields)) {
    obj[key] = valueToJs(val);
  }
  return obj;
};

const analyzeOrderText = async (text, context = {}) => {
  const { restaurantId, menuItemId } = context;

  if (!PROJECT_ID) {
    throw new Error('DIALOGFLOW_PROJECT_ID env var is not set');
  }

  const sessionId = 'session-' + Date.now();
  const sessionPath = sessionClient.projectAgentSessionPath(PROJECT_ID, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: { text, languageCode: 'en-US' },
    },
    // This payload is forwarded verbatim to your webhook as
    queryParams: {
      payload: {
        fields: {
          restaurantId: { stringValue: String(restaurantId || '') },
          menuItemId:   { stringValue: String(menuItemId || '') },
        }
      }
    }
  };

  const [response] = await sessionClient.detectIntent(request);
  const result = response.queryResult;

  const parameters = structToJs(result.parameters);

  // Structured data the webhook attached via a custom Payload response.
  const webhookPayload = result.webhookPayload ? structToJs(result.webhookPayload) : null;

  console.log('Dialogflow result:', JSON.stringify({
    intent: result.intent.displayName,
    parameters,
    fulfillmentText: result.fulfillmentText,
    webhookPayload,
  }, null, 2));

  return {
    intent: result.intent.displayName,
    parameters,
    fulfillmentText: result.fulfillmentText,
    webhookPayload,
  };
};

module.exports = { analyzeOrderText };