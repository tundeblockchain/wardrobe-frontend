import { LEGAL_LAST_UPDATED, type LegalDocumentContent } from "./legalDocument";

export const getPrivacyPolicyContent = (
  appName: string,
): LegalDocumentContent => {
  return {
    title: "Privacy Policy",
    lastUpdated: LEGAL_LAST_UPDATED,
    intro: `This Privacy Policy explains how the operator of ${appName} collects, uses, and shares information when you use the ${appName} websites, iOS and Android apps, and related services (together, the “service”). It is written so that people — including store reviewers — can see what data the product is designed to handle.`,
    sections: [
      {
        id: "who-operates",
        title: "Who operates the service",
        paragraphs: [
          `The service is operated by the operator of ${appName}. The operator is the controller of personal information processed through the service unless a specific feature says otherwise.`,
          "Contact details for privacy and data-subject requests are published in the contact section of this page when a public email or contact URL is configured for the deployment.",
        ],
      },
      {
        id: "scope",
        title: "Scope",
        paragraphs: [
          "This policy covers the marketing website, the mobile apps, and related backend features used to catalog garments, store item details, compose outfits, and generate try-on previews.",
          "App stores, payment providers, and device platforms (including Apple and Google) process some information under their own policies. This policy does not control those independent services.",
        ],
      },
      {
        id: "information-collected",
        title: "Information collected",
        paragraphs: [
          "The operator collects information that you provide, information created when you use wardrobe features, and limited technical information needed to run and secure the service:",
        ],
        bullets: [
          "Account information, such as an email address and authentication identifiers, when an account is created",
          "Wardrobe content, including garment photos, notes, categories, and saved outfits",
          "Try-on images and related previews you choose to generate",
          "Support messages you send to the operator",
          "Technical information such as app version, device type, language, diagnostic or crash logs, and approximate region derived from IP address",
          "Website usage data if analytics or advertising pixels are later enabled on this marketing site (those tools are configured separately and are not required to use the core wardrobe features)",
        ],
      },
      {
        id: "how-information-is-used",
        title: "How information is used",
        paragraphs: [
          "Personal information is used to:",
        ],
        bullets: [
          "Provide, maintain, and improve catalog, outfit, and try-on features you request",
          "Create and secure accounts, and prevent abuse or fraud",
          "Respond to support, privacy, and legal requests",
          "Understand aggregate product usage so the service can be improved",
          "Comply with law and enforce these terms and this policy",
        ],
      },
      {
        id: "ai-and-try-on",
        title: "Photos, try-on, and automated processing",
        paragraphs: [
          `${appName} is built around photos of clothing and, when you use try-on, images used to preview an outfit. Those images are processed to provide the feature you asked for — for example, storing a garment, reading an item detail view, or generating a try-on preview.`,
          "Images and related wardrobe data are not sold. They are not used to train independent public foundation models as a default practice. If that practice changes, this policy will be updated before such use.",
          "Automated processing may be performed by the operator or by subprocessors solely to operate try-on and related previews. Outputs are illustrative. They are not a biometric identification system, and they are not medical, sizing, or professional styling advice.",
        ],
      },
      {
        id: "sharing",
        title: "How information is shared",
        paragraphs: [
          "The operator does not sell personal information. Information is shared only as needed to operate the service:",
        ],
        bullets: [
          "Service providers and subprocessors that host infrastructure, deliver email, analyze crashes, or run try-on processing, under contracts that limit their use of the data",
          "Store platforms (such as Apple App Store and Google Play) when you install, purchase, or review the app",
          "Authorities or other parties when the operator believes disclosure is required by law, to protect safety, or to defend legal rights",
          "A successor operator if the product is transferred, provided the receiving party continues to protect the information in a manner consistent with this policy",
        ],
      },
      {
        id: "retention",
        title: "Retention",
        paragraphs: [
          "Account data and wardrobe content are kept for as long as the account remains open and as needed to provide the service.",
          "If you delete an account or an item, the operator will delete or de-identify associated personal information within a reasonable period, unless a longer retention period is required for security, dispute resolution, backups, or law. Residual copies in encrypted backups are removed on the backup rotation cycle.",
        ],
      },
      {
        id: "security",
        title: "Security",
        paragraphs: [
          "The operator uses reasonable administrative, technical, and organizational measures appropriate to the nature of wardrobe photos and account data, including access controls and encrypted transport where supported.",
          "No method of transmission or storage is completely secure. If a breach that affects your personal information is discovered, the operator will take steps required by applicable law, which may include notifying you and regulators.",
        ],
      },
      {
        id: "children",
        title: "Children’s privacy",
        paragraphs: [
          `The service is not directed at children under 13, and the operator does not knowingly collect personal information from children under 13. ${appName} is intended for users who can enter a contract in their region.`,
          "If the operator learns that personal information of a child under 13 has been collected, that information will be deleted. Parents or guardians should contact the operator using the details on this page.",
        ],
      },
      {
        id: "your-rights",
        title: "Your choices and rights",
        paragraphs: [
          "Depending on your region (including the EEA, UK, and some US states), you may have the right to request access, correction, deletion, portability, restriction, or objection, and to withdraw consent where processing is based on consent.",
          "You may also request deletion of an account and wardrobe content as described in the Terms of Service. To make a request, contact the operator using the details on this page. The operator may need to verify the request before acting on it.",
          "You may lodge a complaint with a supervisory authority. The operator encourages contacting the operator first so the request can be addressed directly.",
        ],
      },
      {
        id: "international",
        title: "International processing",
        paragraphs: [
          "The operator and its subprocessors may process information in countries other than the one where you live. Those countries may have different data-protection laws. Where required, the operator uses appropriate safeguards for cross-border transfers.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies and similar technologies",
        paragraphs: [
          "The marketing website may use strictly necessary cookies to operate the site. Optional analytics or advertising pixels (for example Google Analytics or Meta Pixel) are configured through public environment variables and are not wired in this MVP unless a later release enables them.",
          "Mobile apps may use on-device identifiers and diagnostic software development kits to keep the product reliable. You can control some tracking through device and store settings.",
        ],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        paragraphs: [
          "The operator may update this policy as the product, subprocessors, or laws change. The date at the top of this page is the last update. Material changes will be posted here; when practical, an in-app or website notice will also be provided.",
          "This document is intended as clear MVP copy for product and store review. It may be updated after professional legal review.",
        ],
      },
    ],
  };
};
