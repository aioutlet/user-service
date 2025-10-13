/**
 * Event Handlers Registration
 * Registers all event handlers for the user service consumer
 */

import logger from '../../shared/observability/logging/index.js';
import { handleOrderCompleted } from './order.handler.js';
import { handleFraudDetected } from './fraud.handler.js';
import { handlePaymentMilestone } from './payment.handler.js';

/**
 * Register all event handlers with the message broker
 * @param {IMessageBroker} messageBroker - The message broker instance
 */
export function registerEventHandlers(messageBroker) {
  try {
    // Order events - update user loyalty/reputation
    messageBroker.registerEventHandler('order.completed', handleOrderCompleted);

    // Fraud events - suspend/flag accounts
    messageBroker.registerEventHandler('fraud.detected', handleFraudDetected);

    // Payment events - upgrade tier/status
    messageBroker.registerEventHandler('payment.milestone', handlePaymentMilestone);

    logger.info('✅ Registered 3 event handlers for user service');
  } catch (error) {
    logger.error('❌ Failed to register event handlers:', error);
    throw error;
  }
}
