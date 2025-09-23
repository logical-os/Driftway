import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
    user: mongoose.Schema.Types.ObjectId;
    jwt: string;
    ipAddress: string;
    expiresAt: Date;
}

const SessionSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jwt: { type: String, required: true, unique: true },
    ipAddress: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

export default mongoose.model<ISession>('Session', SessionSchema);
