import { Container, Paper, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { sendContactMessage, type SendContactMessageInput } from "../api/contact";
import { ContactForm } from "../components/contact/ContactForm";
import { SectionSurface } from "../components/surfaces/SectionSurface";
import { getPublicAppEnv, type PublicAppEnv } from "../config/env";
import {
  CONTACT_BUG_SUBJECT,
  CONTACT_TYPE_QUERY_PARAM,
  isContactBugType,
} from "../routes/paths";

export type ContactPageProps = {
  env?: PublicAppEnv;
  sendMessage?: (input: SendContactMessageInput) => ReturnType<
    typeof sendContactMessage
  >;
};

export const ContactPage = ({
  env = getPublicAppEnv(),
  sendMessage,
}: ContactPageProps) => {
  const [searchParams] = useSearchParams();
  const isBugReport = isContactBugType(
    searchParams.get(CONTACT_TYPE_QUERY_PARAM),
  );
  const headingId = "contact-page-heading";
  const heading = isBugReport ? CONTACT_BUG_SUBJECT : "Contact us";
  const description = isBugReport
    ? `Tell the ${env.appName} team what went wrong so we can look into it.`
    : `Send a message to the ${env.appName} team. We use this form for product questions and support requests.`;

  return (
    <SectionSurface
      component="article"
      variant="mist"
      aria-labelledby={headingId}
      sx={{
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={4}>
            <Stack spacing={1.5}>
              <Typography
                variant="overline"
                component="p"
                sx={{ color: "secondary.dark", letterSpacing: "0.16em" }}
              >
                {env.appName}
              </Typography>
              <Typography id={headingId} variant="h1" component="h1">
                {heading}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {description}
              </Typography>
            </Stack>
            <ContactForm
              appName={env.appName}
              apiBaseUrl={env.apiBaseUrl}
              initialSubject={isBugReport ? CONTACT_BUG_SUBJECT : ""}
              sendMessage={sendMessage}
            />
          </Stack>
        </Paper>
      </Container>
    </SectionSurface>
  );
};
