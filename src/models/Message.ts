import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    from: mongoose.Schema.Types.ObjectId;
    channel: mongoose.Schema.Types.ObjectId;
    content: string; // Encrypted content
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
    edited: boolean;
    editedAt?: Date;
    attachments: string[];
    messageType: 'text' | 'image' | 'file' | 'system';
}

const MessageSchema: Schema = new Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    attachments: [{ type: String }],
    messageType: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
});

export default mongoose.model<IMessage>('Message', MessageSchema);
