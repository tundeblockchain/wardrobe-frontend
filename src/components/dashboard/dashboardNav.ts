import type { SvgIconComponent } from "@mui/icons-material";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import ManageAccountsOutlined from "@mui/icons-material/ManageAccountsOutlined";
import StyleOutlined from "@mui/icons-material/StyleOutlined";
import { appPaths } from "../../routes/paths";

export type DashboardNavItem = {
  id: string;
  label: string;
  path: string;
  Icon: SvgIconComponent;
  end?: boolean;
};

export const dashboardLogOutLabel = "Log out";

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
    id: "virtual-try-on",
    label: "Virtual Try On",
    path: appPaths.appVirtualTryOn,
    Icon: AutoAwesomeOutlined,
  },
  {
    id: "settings",
    label: "Profile & Settings",
    path: appPaths.appSettings,
    Icon: ManageAccountsOutlined,
  },
];
