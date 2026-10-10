
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

    // Only initialize free usage for free-plan users.
    if (hasPremiumPlan) {
      req.free_usage = Number(
        user.privateMetadata.free_usage ?? 0
      );
    } else {
      const usage = Number(
        user.privateMetadata.free_usage ?? 0
      );

      req.free_usage = usage;
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};
