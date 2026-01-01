import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function FeedbackPage() {
  return (
    <SettingsPage>
      <SettingsTitle>Feedback</SettingsTitle>

      <SettingsContent className="flex flex-col gap-5">
        <div className="text-muted-foreground text-sm">
          We&apos;d love to hear from you! If you have any feedback, questions, or issues, please
          reach out to us at:
          <br />
          <a
            href="mailto:support@buka.studio?subject=EchoTab Feedback"
            className="text-foreground underline">
            support@buka.studio
          </a>
        </div>
        <div className="text-muted-foreground text-sm">
          EchoTab is open source! You can view the code, report bugs, or contribute on
          <a
            href="https://github.com/buka-studio/echotab"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline">
            GitHub
          </a>
          .
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
