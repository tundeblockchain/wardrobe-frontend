import { useEffect, useRef } from "react";
import { useAuth } from "../../auth/useAuth";
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
  const appliedHash = useRef<string | undefined>(undefined);
  const uid = user?.id?.trim();
  const marketingOk = consent?.marketing === true;

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
