require("dotenv").config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    apiUrl: process.env.API_URL,
    socketUrl: process.env.SOCKET_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  turnServer: {
    url: process.env.TURN_SERVER_URL,
    username: process.env.TURN_SERVER_USERNAME,
    credential: process.env.TURN_SERVER_CREDENTIAL,
  },
  environment: process.env.NODE_ENV || "development",
};
