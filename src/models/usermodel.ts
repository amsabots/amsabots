import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: Number,
      required: true,
    },
  },
  { timestamps: { createdAt: "created_at" } }
);
const User = mongoose.model("User", userSchema);

export { User };
