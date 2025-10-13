/**
 * Payment Event Handlers
 * Handles payment milestone events for user tier upgrades
 */

import logger from '../../shared/observability/logging/index.js';
import User from '../../shared/models/user.model.js';

/**
 * Handle payment.milestone event
 * Upgrades user tier/status based on spending milestones
 * @param {EventMessage} event - The event message
 */
export async function handlePaymentMilestone(event) {
  const { correlationId, data } = event;

  try {
    logger.business('Processing payment.milestone event', null, {
      correlationId,
      userId: data.userId,
      milestone: data.milestone,
      totalSpent: data.totalSpent,
    });

    // TODO: Implement tier upgrade logic
    // const tierMap = {
    //   1000: 'silver',
    //   5000: 'gold',
    //   10000: 'platinum'
    // };
    //
    // const newTier = tierMap[data.milestone];
    // if (newTier) {
    //   await User.findByIdAndUpdate(data.userId, {
    //     tier: newTier,
    //     tierUpgradedAt: new Date()
    //   });
    // }

    logger.business('✅ Payment milestone processed for user', null, {
      correlationId,
      userId: data.userId,
      milestone: data.milestone,
    });
  } catch (error) {
    logger.error('❌ Failed to process payment.milestone event', null, {
      correlationId,
      error: error.message,
      stack: error.stack,
      userId: data?.userId,
    });
    throw error;
  }
}
