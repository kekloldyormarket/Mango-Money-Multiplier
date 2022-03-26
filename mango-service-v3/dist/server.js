"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
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
const app = new app_1.default();
app.listen();
//# sourceMappingURL=server.js.map