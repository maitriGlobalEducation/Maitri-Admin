import mongoose, { Schema, type Model } from "mongoose";

export type AdminRole = "COUNSELLOR" | "EDITOR" | "MANAGER" | "SUPER_ADMIN";

export interface IAdmin {
  username: string;
  password: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._-]+$/,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["COUNSELLOR", "EDITOR", "MANAGER", "SUPER_ADMIN"],
      default: "EDITOR",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Admin: Model<IAdmin> =
  (mongoose.models.Admin as Model<IAdmin> | undefined) ??
  mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;
