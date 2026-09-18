import { LegalDocument } from "../components/legal/LegalDocument";
import { getPublicAppEnv } from "../config/env";
import { getPrivacyPolicyContent } from "../content/legal/privacyPolicy";
import { appPaths } from "../routes/paths";

export const PrivacyPolicyPage = () => {
  const { appName, legalContactEmail, legalContactUrl } = getPublicAppEnv();

  return (
    <LegalDocument
      appName={appName}
      content={getPrivacyPolicyContent(appName)}
      contactEmail={legalContactEmail}
      contactUrl={legalContactUrl}
      relatedLink={{
        to: appPaths.terms,
        label: "Terms of Service",
        ariaLabel: "Terms of Service",
      }}
    />
  );
};
