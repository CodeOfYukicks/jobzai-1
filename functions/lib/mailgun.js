"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const form_data_1 = __importDefault(require("form-data"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const functions = __importStar(require("firebase-functions"));
// Vérification de la configuration
const config = functions.config();
if (!config.mailgun) {
    throw new Error('Mailgun configuration is missing');
}
const { api_key, domain, from_email } = config.mailgun;
if (!api_key || !domain || !from_email) {
    throw new Error('Missing required Mailgun configuration values');
}
const mailgun = new mailgun_js_1.default(form_data_1.default);
const mg = mailgun.client({
    username: 'api',
    key: api_key
});
const sendEmail = async (emailData) => {
    try {
        const result = await mg.messages.create(domain, Object.assign({ from: from_email }, emailData));
        console.log('Email sent successfully:', result);
        return result;
    }
    catch (error) {
        console.error('Mailgun error:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=mailgun.js.map