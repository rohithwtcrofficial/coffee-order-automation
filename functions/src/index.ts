import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 */
admin.initializeApp();

/**
 * ============================================
 * CLOUD FUNCTIONS EXPORTS
 * ============================================
 * Add all function exports here for easy management
 */

// 📞 Callable Functions (onCall)
export { createAdmin } from './callables/createAdmin';

// 🔔 Firestore Triggers
export { onOrderCreated, onOrderStatusChange } from './triggers/orderTriggers';

// 🪝 Webhooks
export { dukaanWebhookTest } from './webhooks/dukaanWebhookTest';

// 📅 Scheduled Functions (add when needed)
// export { dailyReport } from './scheduled/dailyReports';