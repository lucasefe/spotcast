"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NoActiveDeviceError extends Error {
    constructor(session) {
        super();
        this.session = session;
    }
}
exports.NoActiveDeviceError = NoActiveDeviceError;
//# sourceMappingURL=errors.js.map