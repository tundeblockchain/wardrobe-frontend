import { LegalDocument } from "../components/legal/LegalDocument";
import { getPublicAppEnv } from "../config/env";
import { getTermsOfServiceContent } from "../content/legal/termsOfService";
import { appPaths } from "../routes/paths";

export const TermsOfServicePage = () => {
  const { appName, legalContactEmail, legalContactUrl } = getPublicAppEnv();

  return (
    <LegalDocument
      appName={appName}
      content={getTermsOfServiceContent(appName)}
      contactEmail={legalContactEmail}
      contactUrl={legalContactUrl}
      relatedLink={{
        to: appPaths.privacy,
        label: "Privacy Policy",
        ariaLabel: "Privacy Policy",
      }}
    />
  );
};
