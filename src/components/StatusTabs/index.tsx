import { Tabs, TabList, Tab } from "@chakra-ui/react";
import type { TabsProps } from "@chakra-ui/react";

const DEFAULT_STATUSES = ["all", "active", "trashed"] as const;
export type Status = typeof DEFAULT_STATUSES[number];
type OwnTabsProps = Omit<TabsProps, "index" | "onChange" | "children">;

export function StatusTabs<
  T extends readonly string[] = typeof DEFAULT_STATUSES
>({
  statuses,
  status,
  onStatusChange,
  variant = "unstyled",
  ...tabsProps
}: {
  statuses?: T;
  status: T[number];
  onStatusChange: (next: T[number]) => void;
} & OwnTabsProps) {
  const tabs = (statuses ?? DEFAULT_STATUSES) as readonly string[];
  const index = Math.max(0, tabs.indexOf(status as string));

  return (
    <Tabs
      variant={variant}
      index={index}
      onChange={(i) => onStatusChange((tabs[i] ?? tabs[0]) as T[number])}
      {...tabsProps}
    >
      <TabList>
        {tabs.map((s, i) => {
          const isSelected = i === index;
          return (
            <Tab
              key={s}
              bg={isSelected ? "#0C2556" : "gray.200"}
              color={isSelected ? "white" : "black"}
              textTransform="capitalize"
              _hover={{ bg: isSelected ? "#0C2556" : "gray.300" }}
            >
              {s}
            </Tab>
          );
        })}
      </TabList>
    </Tabs>
  );
}
