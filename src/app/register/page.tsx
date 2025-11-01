import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Create your teacher account
            </CardTitle>
            <p className="text-sm text-neutral-500">
              Build decks, launch live sessions, and monitor progress.
            </p>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <p className="mt-6 text-sm text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-neutral-900 underline"
              >
                Sign in instead
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
