import { useEffect, useState } from "react";
import {
  getConsent,
  subscribeConsent,
  type ConsentChoice,
} from "../config/consent";

export const useConsent = (): ConsentChoice | null => {
  const [choice, setChoice] = useState<ConsentChoice | null>(getConsent);

  useEffect(() => {
    return subscribeConsent(setChoice);
  }, []);

  return choice;
};
