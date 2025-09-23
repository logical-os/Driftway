import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
    name: string;
    server: mongoose.Schema.Types.ObjectId;
}

const ChannelSchema: Schema = new Schema({
    name: { type: String, required: true },
    server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server', required: true },
});

export default mongoose.model<IChannel>('Channel', ChannelSchema);
