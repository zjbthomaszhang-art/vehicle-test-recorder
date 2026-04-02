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
        PORT: 3001,
        DB_HOST: '127.0.0.1',
        DB_USER: 'root',
        DB_PASSWORD: 'REDACTED',
        DB_NAME: 'test_recorder'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    }
  ]
};
