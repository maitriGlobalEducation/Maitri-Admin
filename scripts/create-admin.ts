import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import Admin from "../models/Admin";

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in your environment.",
    );
  }

  if (password.length < 8) {
    throw new Error("Admin password must be at least 12 characters.");
  }

  await connectDB();

  const existingAdmin = await Admin.findOne({ username });

  if (existingAdmin) {
    throw new Error(`An admin with username ${username} already exists.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await Admin.create({
    password: passwordHash,
    role: "SUPER_ADMIN",
    isActive: true,
  });

  console.log(`Super admin created: ${username}`);
}

main()
  .catch((error) => {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
