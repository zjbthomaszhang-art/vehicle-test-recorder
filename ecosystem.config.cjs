module.exports = {
  apps: [
    {
      name: 'vehicle-test-backend',
      script: './dist-server/index.cjs',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    }
  ]
};
