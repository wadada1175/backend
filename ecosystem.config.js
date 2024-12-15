module.exports = {
  apps: [
    {
      name: "app",
      script: "node",
      args: "server.js",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
