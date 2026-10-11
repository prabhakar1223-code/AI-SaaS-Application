
import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    const { userId, has } = req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const hasPremiumPlan = await has({
      plan: "premium",
    });

    const user = await clerkClient.users.getUser(userId);

    req.plan = hasPremiumPlan ? "premium" : "free";

    // Get free usage from Clerk metadata
    req.free_usage = Number(
      user.privateMetadata?.free_usage ?? 0
    );

    next();
  } catch (error) {
    console.error("Auth middleware error:", {
      message: error.message,
      code: error.code,
      status: error.status,
      errors: error.errors,
      cause: error.cause?.message,
    });

    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};
