function getApiInfo() {
  return { name: 'Taskr API', version: '1.0.0', docs: '/health' };
}

function getHealth() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

module.exports = { getApiInfo, getHealth };
