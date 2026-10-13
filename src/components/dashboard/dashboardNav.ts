import type { SvgIconComponent } from "@mui/icons-material";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import FaceRetouchingNaturalOutlined from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import StyleOutlined from "@mui/icons-material/StyleOutlined";
import { appPaths } from "../../routes/paths";

export type DashboardNavItem = {
  id: string;
  label: string;
  path: string;
  Icon: SvgIconComponent;
  end?: boolean;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    id: "home",
    label: "Home",
    path: appPaths.app,
    Icon: HomeOutlined,
    end: true,
  },
  {
    id: "wardrobes",
    label: "Wardrobes",
    path: appPaths.appWardrobes,
    Icon: CheckroomOutlined,
  },
  {
    id: "outfits",
    label: "Outfits",
    path: appPaths.appOutfits,
    Icon: StyleOutlined,
  },
  {
    id: "virtual-profiles",
    label: "Virtual Profiles",
    path: appPaths.appVirtualProfiles,
    Icon: FaceRetouchingNaturalOutlined,
  },
  {
    id: "plan",
    label: "Plan",
    path: appPaths.appPlan,
    Icon: CalendarMonthOutlined,
  },
];
