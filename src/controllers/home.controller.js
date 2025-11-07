export function getWelcomeMessage(req, res) {
  res.json({
    message: 'Welcome to the User Service',
    service: process.env.NAME,
    description: 'User management and profile service for AIOutlet platform',
  });
}

export function getVersion(req, res) {
  res.json({
    service: process.env.NAME,
    version: process.env.VERSION,
    environment: process.env.NODE_ENV || 'development',
  });
}
