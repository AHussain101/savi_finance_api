// Sign In Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn />
    </div>
  );
}
