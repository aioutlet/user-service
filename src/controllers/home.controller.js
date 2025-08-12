export function getWelcomeMessage(req, res) {
  res.json({
    message: 'Welcome to the User Service',
    service: 'user-service',
    description: 'User management and profile service for AIOutlet platform',
  });
}

export function getVersion(req, res) {
  res.json({
    version: process.env.API_VERSION || '1.0.0',
    service: 'user-service',
    environment: process.env.NODE_ENV || 'development',
  });
}
