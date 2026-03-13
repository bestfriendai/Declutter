import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();
        const providedName = String(params.name ?? "").trim();
        const fallbackName =
          email.split("@")[0]?.trim() || "Declutterer";

        return {
          email,
          name: providedName || fallbackName,
          createdAt: Date.now(),
          onboardingComplete: false,
          isAnonymous: false,
        };
      },
    }),
    Anonymous({
      profile() {
        return {
          isAnonymous: true,
          name: "Guest",
          createdAt: Date.now(),
          onboardingComplete: false,
        };
      },
    }),
  ],
});
