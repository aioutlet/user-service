export function getWelcomeMessage(req, res) {
  res.json({
    message: 'Welcome to the User Service',
    service: process.env.SERVICE_NAME,
    description: 'User management and profile service for AIOutlet platform',
  });
}

export function getVersion(req, res) {
  res.json({
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    environment: process.env.NODE_ENV || 'development',
  });
}
