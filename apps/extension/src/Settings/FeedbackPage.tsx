import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function FeedbackPage() {
  return (
    <SettingsPage>
      <SettingsTitle>Feedback</SettingsTitle>

      <SettingsContent>
        <div className="text-muted-foreground text-sm">
          We&apos;d love to hear from you! If you have any feedback, questions, or issues, please
          reach out to us at:
          <br />
          <a href="mailto:support@buka.studio?subject=EchoTab Feedback" className="mt-2 block">
            support@buka.studio
          </a>
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
