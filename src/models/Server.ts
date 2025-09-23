import mongoose, { Document, Schema } from 'mongoose';

export interface IServer extends Document {
    name: string;
    owner: mongoose.Schema.Types.ObjectId;
    members: mongoose.Schema.Types.ObjectId[];
}

const ServerSchema: Schema = new Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export default mongoose.model<IServer>('Server', ServerSchema);
