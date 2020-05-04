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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const spotify = __importStar(require("../spotify"));
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String },
    username: { type: String, required: true },
    photoURL: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresIn: { type: Number, required: true },
    accessTokenRefreshedAt: { type: Date },
    currentPlayer: {
        device: { type: Object },
        shuffleState: { type: Boolean },
        repeatState: {
            type: String,
            enum: ['off', 'track', 'context']
        },
        timestamp: { type: Number },
        context: { type: Object },
        progressMS: { type: Number },
        item: { type: Object },
        currentlyPlayingType: { type: String, enum: ['track', 'episode', 'ad', 'unknown'] },
        isPlaying: { type: Boolean }
    },
    profile: { type: Object }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
const User = mongoose_1.default.model('User', UserSchema);
exports.default = User;
function updateUser(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield findUser(username);
        const currentPlayer = yield getCurrentPlayer(user);
        user.set({ currentPlayer });
        yield user.save();
        return user;
    });
}
exports.updateUser = updateUser;
function findUser(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield User.findOne({ username });
        if (user)
            return user;
        else
            throw new Error(`User not found: ${username}`);
    });
}
exports.findUser = findUser;
function getCurrentPlayer(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentPlayer = yield spotify.getCurrentPlayer(user);
            return currentPlayer;
        }
        catch (error) {
            const isUnauthorized = error.response && error.response.status === 401;
            if (isUnauthorized) {
                const { accessToken } = yield spotify.getAccessToken(user);
                const currentPlayer = yield spotify.getCurrentPlayer(user);
                user.set({ currentPlayer, accessToken, accessTokenRefreshedAt: Date.now() });
                yield user.save();
                return currentPlayer;
            }
            else
                throw error;
        }
    });
}
exports.getCurrentPlayer = getCurrentPlayer;
//# sourceMappingURL=user.js.map