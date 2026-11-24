import { Tab, Tabs } from "@mui/material";
import { supportCopy } from "../../../admin/supportCopy";
import type { SupportConversationStatus } from "../../../api/adminSupport";

export type SupportStatusTabsProps = {
  value: SupportConversationStatus;
  onChange: (status: SupportConversationStatus) => void;
};

const TABS: Array<{ value: SupportConversationStatus; label: string }> = [
  { value: "open", label: supportCopy.openTab },
  { value: "replied", label: supportCopy.repliedTab },
  { value: "closed", label: supportCopy.closedTab },
];

export const SupportStatusTabs = ({
  value,
  onChange,
}: SupportStatusTabsProps) => {
  const handleChange = (_event: unknown, nextValue: string) => {
    if (nextValue === "open" || nextValue === "replied" || nextValue === "closed") {
      onChange(nextValue);
    }
  };

  return (
    <Tabs
      value={value}
      onChange={handleChange}
      aria-label={supportCopy.statusFilterLabel}
      variant="scrollable"
      allowScrollButtonsMobile
    >
      {TABS.map((tab) => (
        <Tab
          key={tab.value}
          value={tab.value}
          label={tab.label}
          tabIndex={0}
          aria-label={tab.label}
        />
      ))}
    </Tabs>
  );
};
