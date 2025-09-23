import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageReaction extends Document {
    message: mongoose.Schema.Types.ObjectId;
    user: mongoose.Schema.Types.ObjectId;
    emoji: string;
    timestamp: Date;
}

const MessageReactionSchema: Schema = new Schema({
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IMessageReaction>('MessageReaction', MessageReactionSchema);