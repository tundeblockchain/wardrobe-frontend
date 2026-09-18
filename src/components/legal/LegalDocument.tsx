import {
  Box,
  Container,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  getLegalContactCopy,
  type LegalDocumentContent,
  type LegalRelatedLink,
} from "../../content/legal/legalDocument";

export type LegalDocumentProps = {
  appName: string;
  content: LegalDocumentContent;
  contactEmail: string | undefined;
  contactUrl: string | undefined;
  relatedLink: LegalRelatedLink;
};

export const LegalDocument = ({
  appName,
  content,
  contactEmail,
  contactUrl,
  relatedLink,
}: LegalDocumentProps) => {
  const headingId = "legal-document-heading";
  const contactCopy = getLegalContactCopy({
    appName,
    contactEmail,
    contactUrl,
  });
  const tableOfContents = [
    ...content.sections,
    { id: "contact", title: contactCopy.title },
  ];

  return (
    <Box
      component="article"
      aria-labelledby={headingId}
      sx={{
        py: { xs: 6, md: 8 },
        bgcolor: "background.default",
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
                Legal
              </Typography>
              <Typography id={headingId} variant="h1" component="h1">
                {content.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated {content.lastUpdated}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {content.intro}
              </Typography>
            </Stack>

            <Box component="nav" aria-label={`${content.title} sections`}>
              <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>
                On this page
              </Typography>
              <Stack
                component="ul"
                spacing={0.75}
                sx={{ m: 0, pl: 2.5, listStyleType: "disc" }}
              >
                {tableOfContents.map((section) => (
                  <Box component="li" key={section.id}>
                    <Link
                      href={`#${section.id}`}
                      color="secondary"
                      underline="hover"
                      tabIndex={0}
                      aria-label={`Jump to ${section.title}`}
                    >
                      {section.title}
                    </Link>
                  </Box>
                ))}
              </Stack>
            </Box>

            {content.sections.map((section) => (
              <Box
                component="section"
                id={section.id}
                key={section.id}
                tabIndex={-1}
                aria-labelledby={`${section.id}-heading`}
                sx={{ scrollMarginTop: 88, outline: "none" }}
              >
                <Stack spacing={1.5}>
                  <Typography
                    id={`${section.id}-heading`}
                    variant="h2"
                    component="h2"
                    sx={{ fontSize: "1.5rem" }}
                  >
                    {section.title}
                  </Typography>
                  {section.paragraphs.map((paragraph) => (
                    <Typography
                      key={paragraph}
                      variant="body1"
                      color="text.secondary"
                    >
                      {paragraph}
                    </Typography>
                  ))}
                  {section.bullets ? (
                    <List
                      component="ul"
                      aria-label={`${section.title} details`}
                      sx={{
                        listStyleType: "disc",
                        pl: 3,
                        py: 0,
                        color: "text.secondary",
                      }}
                    >
                      {section.bullets.map((bullet) => (
                        <ListItem
                          key={bullet}
                          component="li"
                          sx={{ display: "list-item", py: 0.5, px: 0 }}
                        >
                          <ListItemText primary={bullet} />
                        </ListItem>
                      ))}
                    </List>
                  ) : null}
                </Stack>
              </Box>
            ))}

            <Box
              component="section"
              id="contact"
              tabIndex={-1}
              aria-labelledby="contact-heading"
              sx={{ scrollMarginTop: 88, outline: "none" }}
            >
              <Stack spacing={1.5}>
                <Typography
                  id="contact-heading"
                  variant="h2"
                  component="h2"
                  sx={{ fontSize: "1.5rem" }}
                >
                  {contactCopy.title}
                </Typography>
                {contactCopy.paragraphs.map((paragraph) => (
                  <Typography
                    key={paragraph}
                    variant="body1"
                    color="text.secondary"
                  >
                    {paragraph}
                  </Typography>
                ))}
                {contactCopy.email ? (
                  <Link
                    href={`mailto:${contactCopy.email}`}
                    color="secondary"
                    underline="hover"
                    tabIndex={0}
                    aria-label={`Email the operator at ${contactCopy.email}`}
                  >
                    {contactCopy.email}
                  </Link>
                ) : null}
                {contactCopy.contactUrl ? (
                  <Link
                    href={contactCopy.contactUrl}
                    color="secondary"
                    underline="hover"
                    tabIndex={0}
                    aria-label="Operator contact page"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Operator contact page
                  </Link>
                ) : null}
                <Typography variant="body1" color="text.secondary">
                  Related:{" "}
                  <Link
                    component={RouterLink}
                    to={relatedLink.to}
                    color="secondary"
                    underline="hover"
                    tabIndex={0}
                    aria-label={relatedLink.ariaLabel}
                  >
                    {relatedLink.label}
                  </Link>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
