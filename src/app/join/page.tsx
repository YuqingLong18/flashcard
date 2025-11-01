import { JoinForm } from "@/components/run/join-form";

export default function JoinPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="w-full space-y-4 text-center">
        <p className="text-sm uppercase tracking-wide text-neutral-500">
          Students
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          Enter your session code
        </h1>
        <p className="text-sm text-neutral-500">
          Your teacher will share a 6-character code. Enter it below to start
          practicing.
        </p>
      </div>
      <div className="w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <JoinForm />
      </div>
      <p className="text-xs text-neutral-400">
        We only store your responses for this session. No account required.
      </p>
    </main>
  );
}
