import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { isAdminPath } from "../../routes/paths";
import {
  applyTrackingExternalId,
  clearTrackingExternalId,
  hashExternalId,
} from "../../config/trackingIdentity";
import { useConsent } from "../../hooks/useConsent";

export type TrackingIdentityListenerProps = {
  metaPixelId: string | undefined;
  tiktokPixelId: string | undefined;
};

export const TrackingIdentityListener = ({
  metaPixelId,
  tiktokPixelId,
}: TrackingIdentityListenerProps) => {
  const { user } = useAuth();
  const consent = useConsent();
  const { pathname } = useLocation();
  const appliedHash = useRef<string | undefined>(undefined);
  const uid = user?.id?.trim();
  const marketingOk = consent?.marketing === true && !isAdminPath(pathname);

  useEffect(() => {
    const ids = { metaPixelId, tiktokPixelId };

    if (!marketingOk) {
      return;
    }

    if (!uid) {
      if (appliedHash.current) {
        clearTrackingExternalId(ids);
        appliedHash.current = undefined;
      }
      return;
    }

    let cancelled = false;

    void hashExternalId(uid).then((hash) => {
      if (cancelled || !hash) {
        return;
      }

      applyTrackingExternalId(hash, ids);
      appliedHash.current = hash;
    });

    return () => {
      cancelled = true;
    };
  }, [uid, metaPixelId, tiktokPixelId, marketingOk]);

  return null;
};
