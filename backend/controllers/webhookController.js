const { WebhookClient, Payload } = require('dialogflow-fulfillment');
const InventoryItem = require('../models/Inventory'); 
const MenuItem      = require('../models/MenuItem');

exports.handleWebhook = (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  const { restaurantId, menuItemId } = req.body.originalDetectIntentRequest?.payload || {};

  const matchOption = (menuItem, ingredientText) => {
    const lower = ingredientText.toLowerCase();
    return menuItem.customizationOptions?.find(opt => {
      const nameMatch =
        opt.optionName.toLowerCase().includes(lower) ||
        lower.includes(opt.optionName.toLowerCase());
      const ingredientNameMatch = opt.ingredientEffects?.some(eff =>
        eff.inventoryItem?.name?.toLowerCase().includes(lower)
      );
      return nameMatch || ingredientNameMatch;
    });
  };

  // Intent: order.customize 
  async function customizeFood(agent) {
    let ingredients = agent.parameters['ingredients'] ?? agent.parameters['ingredient'] ?? [];
    let actions     = agent.parameters['actions']     ?? agent.parameters['action']     ?? [];
    ingredients = Array.isArray(ingredients) ? ingredients : [ingredients].filter(Boolean);
    actions     = Array.isArray(actions) ? actions : [actions].filter(Boolean);

    if (!menuItemId) {
      agent.add("I couldn't tell which dish this is for — please reopen the customization dialog.");
      return;
    }
    if (!ingredients.length) {
      agent.add("Sorry, I didn't catch which ingredient you'd like to change.");
      return;
    }

    const menuItem = await MenuItem.findOne({ _id: menuItemId, restaurantId })
      .populate('customizationOptions.ingredientEffects.inventoryItem');

    if (!menuItem) {
      agent.add("I couldn't find that menu item.");
      return;
    }

    const results = [];
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      const action = (actions[i] ?? actions[0] ?? 'add').toLowerCase();
      const label = `${action.charAt(0).toUpperCase() + action.slice(1)} ${ing}`;

      const matchedOption = matchOption(menuItem, ing);

      if (!matchedOption) {
        results.push({ ingredient: ing, action, label, achievable: false,
          reason: `${ing} isn't offered as a customization on ${menuItem.name}` });
        continue;
      }

      // REMOVE doesn't consume stock, only ADD/SWAP does
      if (matchedOption.type === 'REMOVE') {
        results.push({ ingredient: ing, action, label, achievable: true });
        continue;
      }

      const effect = matchedOption.ingredientEffects?.[0];
      const stockItem = effect?.inventoryItem;

      if (stockItem && stockItem.currentStock <= 0) {
        results.push({ ingredient: ing, action, label, achievable: false,
          reason: `We're out of ${ing} today` });
      } else if (stockItem && stockItem.currentStock <= stockItem.minimumStock) {
        results.push({ ingredient: ing, action, label, achievable: true,
          warning: `${ing} is running low`, costPerUnit: stockItem.costPerUnit });
      } else {
        results.push({ ingredient: ing, action, label, achievable: true,
          costPerUnit: stockItem?.costPerUnit });
      }
    }

    const accepted = results.filter(r => r.achievable);
    const rejected = results.filter(r => !r.achievable);

    let message;
    if (!rejected.length) {
      message = `Got it! I've updated your order: ${accepted.map(r => r.label).join(', ')}`;
    } else if (accepted.length) {
      message = `I can do ${accepted.map(r => r.label).join(', ')}, but ${rejected.map(r => r.reason).join('; ')}.`;
    } else {
      message = rejected.map(r => r.reason).join('; ');
    }

    agent.add(message);
    agent.add(new Payload('PLATFORM_UNSPECIFIED', {
      accepted: accepted.map(r => ({ label: r.label, warning: r.warning || null })),
      rejected: rejected.map(r => ({ ingredient: r.ingredient, reason: r.reason })),
      message,
    }, { rawPayload: true, sendAsMessage: true }));
  }

  const intentMap = new Map();
  intentMap.set('order.customize', customizeFood);
  intentMap.set('Default Fallback Intent', agent => {
    agent.add("I didn't quite get that. Try something like 'no onions, extra cheese'.");
  });

  agent.handleRequest(intentMap);
};