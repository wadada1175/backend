// prismaClient.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  // errorFormat: "pretty",
  // log: ["query", "info", "warn", "error"],
});

module.exports = prisma;
