import App from "./app";

process.on("SIGTERM", function () {
  console.log("SIGTERM received");
  // todo add cleanup logic
  process.exit();
});

process.on("SIGINT", function () {
  console.log("SIGINT received");
  // todo add cleanup logic
  process.exit();
});

const app = new App();

app.listen();
