import { Button } from "@echotab/ui/Button";

import PulseLogo from "./PulseLogo";

export default function AppError({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col text-center">
        <div className="border-border mx-auto flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm">
          <PulseLogo /> EchoTab
        </div>
        <h1 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Oops, something went wrong!
        </h1>
        <p className="text-muted-foreground mt-4 text-sm">
          We&apos;re sorry, but an unexpected error has occurred. Please try again later or contact
          us at{" "}
          <a
            href="mailto:support@buka.studio?subject=EchoTab Feedback"
            className="focus-ring underline">
            support@buka.studio
          </a>{" "}
          if the issue persists.
        </p>
        <div className="mt-6">
          <Button onClick={resetErrorBoundary}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
