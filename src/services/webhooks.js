function handleTaskUpdate(payload) {
  // TODO: process webhook payload
  console.log('[WEBHOOK] Received:', payload);
  return { received: true };
}

module.exports = { handleTaskUpdate };
