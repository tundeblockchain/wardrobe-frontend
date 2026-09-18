export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocumentContent = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export type LegalRelatedLink = {
  to: string;
  label: string;
  ariaLabel: string;
};

export type LegalContactCopy = {
  title: string;
  paragraphs: string[];
  email: string | undefined;
  contactUrl: string | undefined;
};

export const LEGAL_LAST_UPDATED = "18 September 2026";

export const getLegalContactCopy = ({
  appName,
  contactEmail,
  contactUrl,
}: {
  appName: string;
  contactEmail: string | undefined;
  contactUrl: string | undefined;
}): LegalContactCopy => {
  const paragraphs = [
    `Send privacy requests, terms questions, data-subject requests, and other legal notices for ${appName} to the operator.`,
  ];

  if (contactEmail) {
    paragraphs.push(
      "Use the public contact email published for this deployment, shown below.",
    );
  } else {
    paragraphs.push(
      `A public contact email is not published for this deployment yet. Until one appears on this page, use the ${appName} store listing contact.`,
    );
  }

  if (contactUrl) {
    paragraphs.push(
      "A public operator contact page is also published for this deployment.",
    );
  }

  return {
    title: "Contact the operator",
    paragraphs,
    email: contactEmail,
    contactUrl,
  };
};
