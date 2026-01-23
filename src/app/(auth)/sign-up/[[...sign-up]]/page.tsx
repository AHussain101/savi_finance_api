// Sign Up Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp />
    </div>
  );
}
