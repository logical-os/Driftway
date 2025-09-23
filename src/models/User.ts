import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    publicKey: string;
    bio?: string;
    profilePicture?: string;
    banner?: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    customStatus?: string;
    joinedAt: Date;
    lastSeen: Date;
    isVerified: boolean;
    friends: mongoose.Schema.Types.ObjectId[];
    blockedUsers: mongoose.Schema.Types.ObjectId[];
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    publicKey: { type: String, required: true },
    bio: { type: String, maxlength: 500 },
    profilePicture: { type: String },
    banner: { type: String },
    status: { type: String, enum: ['online', 'away', 'busy', 'offline'], default: 'offline' },
    customStatus: { type: String, maxlength: 100 },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export default mongoose.model<IUser>('User', UserSchema);
