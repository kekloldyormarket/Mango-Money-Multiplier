"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize, uncolorize } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp, ...rest }) => {
    const restString = JSON.stringify(rest);
    return `${timestamp} ${level}: ${message} ${restString === '{}' ? '' : restString}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'warn',
    format: combine(process.env.NODE_ENV !== 'production' ? uncolorize() : colorize(), timestamp(), logFormat),
    transports: [new winston_1.default.transports.Console()]
});
//# sourceMappingURL=logger.js.map