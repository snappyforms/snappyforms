import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/" className="text-sm text-muted-foreground">
          ← Back
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Sign in to SnappyForms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email or mobile number and we&apos;ll send a 6-digit code. No password needed.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <a
        href="/home"
      >
        <Button className="bg-white text-black border-2 border-green-700 w-full">
          Demo | Beneficiary View
        </Button>
      </a>
    </div>
  );
}
