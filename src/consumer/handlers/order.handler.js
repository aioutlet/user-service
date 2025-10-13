/**
 * Order Event Handlers
 * Handles order-related events that affect user state
 */

import logger from '../../shared/observability/logging/index.js';
import User from '../../shared/models/user.model.js';

/**
 * Handle order.completed event
 * Updates user loyalty points and purchase history
 * @param {EventMessage} event - The event message
 */
export async function handleOrderCompleted(event) {
  const { correlationId, data } = event;

  try {
    logger.info('Processing order.completed event', null, {
      correlationId,
      userId: data.userId,
      orderId: data.orderId,
      orderTotal: data.total,
    });

    // TODO: Implement loyalty points calculation
    // const loyaltyPoints = Math.floor(data.total * 0.1); // 10% of order value

    // TODO: Update user with loyalty points
    // await User.findByIdAndUpdate(data.userId, {
    //   $inc: { loyaltyPoints: loyaltyPoints, totalOrders: 1, totalSpent: data.total }
    // });

    logger.info('✅ Order completion processed for user', null, {
      correlationId,
      userId: data.userId,
      orderId: data.orderId,
    });
  } catch (error) {
    logger.error('❌ Failed to process order.completed event', null, {
      correlationId,
      error: error.message,
      stack: error.stack,
      userId: data?.userId,
      orderId: data?.orderId,
    });
    throw error;
  }
}
