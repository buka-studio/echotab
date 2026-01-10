import { motion } from "framer-motion";

import imageUrl from "~/assets/feedback.png";

import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function FeedbackPage() {
  return (
    <SettingsPage>
      <SettingsTitle>Feedback</SettingsTitle>

      <SettingsContent className="flex h-full flex-col items-center gap-5">
        <motion.img
          initial={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.25 }}
          src={imageUrl}
          alt="Buka Studio team"
          className="h-auto max-h-[145px] w-full object-contain"
        />

        <div className="flex max-w-[350px] flex-col text-center">
          <h1 className="text-sm font-semibold">Help improve EchoTab</h1>

          <div className="text-muted-foreground mb-4 text-sm">
            <p>Found something worth flagging?</p>
            <p>
              Reach us at{" "}
              <a
                href="mailto:support@buka.studio?subject=EchoTab Feedback"
                className="hover:text-foreground underline">
                support@buka.studio
              </a>
              .
            </p>
          </div>
          <div className="text-muted-foreground text-sm">
            <p>
              EchoTab is open source. Browse the code, report bugs, or contribute on{" "}
              <a
                href="https://github.com/buka-studio/echotab"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground underline">
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
