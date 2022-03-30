"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const example_1 = __importDefault(require("./example"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use(body_parser_1.default.json({ limit: "50mb" }));
        this.fc = new example_1.default();
        this.app.use("/", this.fc.router);
    }
    listen() {
        const port = 3138;
        this.app.listen(port);
    }
    getServer() {
        return this.app;
    }
}
exports.default = App;
const app = new App();
setInterval(function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield app.fc.checkRates();
        }
        catch (err) {
            console.log(err);
        }
    });
}, 1500);
setInterval(function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            app.fc.doing = false;
        }
        catch (err) {
            console.log(err);
        }
    });
}, 60000);
app.listen();
//# sourceMappingURL=app.js.map