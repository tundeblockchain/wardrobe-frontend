import { LEGAL_LAST_UPDATED, type LegalDocumentContent } from "./legalDocument";

export const getTermsOfServiceContent = (
  appName: string,
): LegalDocumentContent => {
  return {
    title: "Terms of Service",
    lastUpdated: LEGAL_LAST_UPDATED,
    intro: `These Terms of Service govern access to and use of the ${appName} websites, mobile applications, and related services (together, the “service”). By using the service, you agree to these terms. If you do not agree, do not use the service.`,
    sections: [
      {
        id: "agreement",
        title: "Agreement",
        paragraphs: [
          `The service is operated by the operator of ${appName}. These terms are a binding agreement between you and the operator.`,
          "The operator may update these terms as the product, stores, or legal requirements change. Continued use after an update means you accept the revised terms. The date at the top of this page is the last update.",
        ],
      },
      {
        id: "the-service",
        title: "The service",
        paragraphs: [
          `${appName} is a wardrobe companion for cataloging garments, saving item details, composing outfits, and previewing how looks sit together (including try-on previews).`,
          "Features, availability, and store listings may differ between iOS, Android, the web, and any AI-app catalog where the operator publishes the product. The operator may add, change, or withdraw features.",
        ],
      },
      {
        id: "eligibility",
        title: "Eligibility",
        paragraphs: [
          "You must be old enough to form a binding contract in your region. The service is not directed at children under 13, and accounts for children under 13 are not permitted.",
          "If you use the service on behalf of an organization, you confirm that you have authority to bind that organization.",
        ],
      },
      {
        id: "accounts",
        title: "Accounts",
        paragraphs: [
          "Some features may require an account. You are responsible for the information you provide, for keeping credentials confidential, and for activity on the account.",
          "Notify the operator if you believe an account has been accessed without permission. The operator may suspend or close an account that appears compromised, unused, or in breach of these terms.",
          "If an account is created, you may request deletion of the account and associated wardrobe content through in-app account settings when available, or by contacting the operator using the details on this page.",
        ],
      },
      {
        id: "user-content",
        title: "User content",
        paragraphs: [
          "You retain rights in content you upload, including garment photos, try-on images, notes, categories, and outfits (“user content”). You are responsible for that content and for having the rights needed to upload and use it in the service.",
          `You grant the operator a worldwide, non-exclusive, royalty-free license to host, store, reproduce, and display user content solely to operate, secure, and improve ${appName} for you — including generating try-on and outfit previews you request.`,
          "Do not upload content that you do not have the right to use, that depicts others without permission, or that is unlawful, harmful, or infringing.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        paragraphs: [
          "Use the service only for lawful personal wardrobe organization and related previews. The following is not allowed:",
        ],
        bullets: [
          "Attempting to access another person’s account, wardrobe, or data",
          "Interfering with, scraping, overloading, or reverse engineering the service except as permitted by law",
          "Uploading malware or using the service to harass, exploit, or mislead others",
          "Misrepresenting the service, including presenting try-on previews as professional, medical, or size-guarantee advice",
          "Using automated means to create accounts or extract content in a way that harms the service",
        ],
      },
      {
        id: "intellectual-property",
        title: "Intellectual property",
        paragraphs: [
          `The service, including software, design, trademarks, and documentation, is owned by the operator or its licensors. These terms do not transfer ownership of ${appName} to you.`,
          "You may not copy, modify, or redistribute the operator’s branding or software except as the service expressly allows.",
        ],
      },
      {
        id: "mobile-and-stores",
        title: "Mobile apps and stores",
        paragraphs: [
          "If you download the iOS or Android app, Apple, Google, or another store operator may have additional terms that also apply. Those store terms govern the store relationship; these terms govern use of the service itself.",
          "Store listings, screenshots, and product descriptions are informational. Billing, refunds, and install rights for paid store products follow the applicable store’s rules unless the operator states otherwise in writing.",
        ],
      },
      {
        id: "disclaimers",
        title: "Disclaimers",
        paragraphs: [
          "The service is provided “as is” and “as available.” Wardrobe organization and try-on previews are for personal convenience. They are not a guarantee of fit, color accuracy, fabric behavior, or styling outcome.",
          "The operator does not warrant that the service will be uninterrupted, error-free, or free of harmful components. To the fullest extent permitted by law, implied warranties of merchantability, fitness for a particular purpose, and non-infringement are disclaimed.",
        ],
      },
      {
        id: "limitation-of-liability",
        title: "Limitation of liability",
        paragraphs: [
          "To the fullest extent permitted by law, the operator is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost data, outfits, photos, or profits, arising from use of the service.",
          "To the fullest extent permitted by law, the operator’s total liability for any claim relating to the service is limited to the greater of (a) the amount you paid the operator for the service in the 12 months before the claim, or (b) fifty US dollars (US $50).",
          "Some regions do not allow certain limitations. In those regions, the operator’s liability is limited to the maximum extent permitted.",
        ],
      },
      {
        id: "termination",
        title: "Termination",
        paragraphs: [
          "You may stop using the service at any time and may request account deletion as described above.",
          "The operator may suspend or end access if these terms are breached, if required by law, or if the service is discontinued. Provisions that should survive (including intellectual property, disclaimers, and liability limits) remain in effect.",
        ],
      },
      {
        id: "governing-law",
        title: "Governing law",
        paragraphs: [
          "These terms are governed by the laws applicable to the operator’s place of establishment, excluding conflict-of-law rules, unless mandatory consumer law in your region provides otherwise.",
          "If a dispute cannot be resolved informally through the contact details on this page, courts competent for the operator’s establishment have jurisdiction, again subject to mandatory consumer protections.",
        ],
      },
      {
        id: "changes",
        title: "Changes",
        paragraphs: [
          "The operator may revise these terms. Material changes will be reflected on this page with an updated date. For a significant change, the operator may also provide an in-app or website notice when practical.",
          "This document is intended as clear MVP copy for product and store review. It may be updated after professional legal review without changing how you are notified of revisions.",
        ],
      },
    ],
  };
};
