import { LegalDocument } from "../components/legal/LegalDocument";
import { openCookiePreferences } from "../config/consent";
import { getPublicAppEnv } from "../config/env";
import { getPrivacyPolicyContent } from "../content/legal/privacyPolicy";
import { appPaths } from "../routes/paths";
import { DashboardThemeProvider } from "../theme/DashboardThemeProvider";

export const PrivacyPolicyPage = () => {
  const { appName, legalContactEmail, legalContactUrl } = getPublicAppEnv();

  const handleSectionAction = (actionId: string) => {
    if (actionId !== "cookie-settings") {
      return;
    }

    openCookiePreferences();
  };

  return (
    <DashboardThemeProvider>
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
        onSectionAction={handleSectionAction}
      />
    </DashboardThemeProvider>
  );
};
