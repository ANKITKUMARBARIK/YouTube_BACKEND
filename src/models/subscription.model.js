import mongoose, { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId, // one who is subscribing
            ref: "User",
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
            ref: "User",
        },
    },
    { timestamps: true }
);

const Subscription = model("Subscription", subscriptionSchema);

export default Subscription;
