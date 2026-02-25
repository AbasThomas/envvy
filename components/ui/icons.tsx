import { forwardRef } from "react";
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from "@hugeicons/react";
import {
  ActivityIcon as HiActivityIcon,
  ArrowDownIcon as HiArrowDownIcon,
  ArrowRightIcon as HiArrowRightIcon,
  ArrowUpIcon as HiArrowUpIcon,
  Bell as HiBell,
  Bolt as HiBolt,
  BookOpenIcon as HiBookOpenIcon,
  CalendarIcon as HiCalendarIcon,
  Check as HiCheck,
  ChevronLeft as HiChevronLeft,
  ChevronRight as HiChevronRight,
  CodeFolderIcon as HiCodeFolderIcon,
  CodeIcon as HiCodeIcon,
  CompassIcon as HiCompassIcon,
  ComputerTerminalIcon as HiComputerTerminalIcon,
  CopyIcon as HiCopyIcon,
  CreditCardIcon as HiCreditCardIcon,
  ExternalLink as HiExternalLink,
  FilterIcon as HiFilterIcon,
  GitForkIcon as HiGitForkIcon,
  GithubIcon as HiGithubIcon,
  GlobeIcon as HiGlobeIcon,
  History as HiHistory,
  HomeIcon as HiHomeIcon,
  KeyRound as HiKeyRound,
  LayoutDashboard as HiLayoutDashboard,
  LinkIcon as HiLinkIcon,
  LockIcon as HiLockIcon,
  LogOut as HiLogOut,
  MailIcon as HiMailIcon,
  MapPinIcon as HiMapPinIcon,
  MenuIcon as HiMenuIcon,
  MessageSquare as HiMessageSquare,
  MoonIcon as HiMoonIcon,
  MoveVertical as HiMoveVertical,
  PencilLine as HiPencilLine,
  Plus as HiPlus,
  Receipt as HiReceipt,
  RefreshCcw as HiRefreshCcw,
  RefreshCw as HiRefreshCw,
  RocketIcon as HiRocketIcon,
  RotateCw as HiRotateCw,
  Save as HiSave,
  SearchIcon as HiSearchIcon,
  Settings2 as HiSettings2,
  SettingsIcon as HiSettingsIcon,
  ShareIcon as HiShareIcon,
  ShieldCheck as HiShieldCheck,
  ShieldIcon as HiShieldIcon,
  SparklesIcon as HiSparklesIcon,
  StarIcon as HiStarIcon,
  SunIcon as HiSunIcon,
  Terminal as HiTerminal,
  Trash2 as HiTrash2,
  TrendingUp as HiTrendingUp,
  UserAdd02Icon as HiUserAdd02Icon,
  UserIcon as HiUserIcon,
  Users as HiUsers,
  X as HiX,
  ZapIcon as HiZapIcon,
} from "@hugeicons/core-free-icons";

type IconProps = Omit<HugeiconsProps, "icon" | "altIcon">;

function createIcon(name: string, icon: IconSvgElement) {
  const Component = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
    return <HugeiconsIcon ref={ref} icon={icon} {...props} />;
  });

  Component.displayName = name;
  return Component;
}

export const ActivityIcon = createIcon("ActivityIcon", HiActivityIcon);
export const ArrowDownIcon = createIcon("ArrowDownIcon", HiArrowDownIcon);
export const ArrowRightIcon = createIcon("ArrowRightIcon", HiArrowRightIcon);
export const ArrowUpIcon = createIcon("ArrowUpIcon", HiArrowUpIcon);
export const BellIcon = createIcon("BellIcon", HiBell);
export const BoltIcon = createIcon("BoltIcon", HiBolt);
export const BookOpenIcon = createIcon("BookOpenIcon", HiBookOpenIcon);
export const CalendarIcon = createIcon("CalendarIcon", HiCalendarIcon);
export const CheckIcon = createIcon("CheckIcon", HiCheck);
export const ChevronLeftIcon = createIcon("ChevronLeftIcon", HiChevronLeft);
export const ChevronRightIcon = createIcon("ChevronRightIcon", HiChevronRight);
export const CodeIcon = createIcon("CodeIcon", HiCodeIcon);
export const CompassIcon = createIcon("CompassIcon", HiCompassIcon);
export const CopyIcon = createIcon("CopyIcon", HiCopyIcon);
export const CreditCardIcon = createIcon("CreditCardIcon", HiCreditCardIcon);
export const ExternalLinkIcon = createIcon("ExternalLinkIcon", HiExternalLink);
export const FilterIcon = createIcon("FilterIcon", HiFilterIcon);
export const FolderGit2Icon = createIcon("FolderGit2Icon", HiCodeFolderIcon);
export const GitForkIcon = createIcon("GitForkIcon", HiGitForkIcon);
export const GithubIcon = createIcon("GithubIcon", HiGithubIcon);
export const GlobeIcon = createIcon("GlobeIcon", HiGlobeIcon);
export const HistoryIcon = createIcon("HistoryIcon", HiHistory);
export const HomeIcon = createIcon("HomeIcon", HiHomeIcon);
export const KeyRoundIcon = createIcon("KeyRoundIcon", HiKeyRound);
export const LayoutDashboardIcon = createIcon("LayoutDashboardIcon", HiLayoutDashboard);
export const LinkIcon = createIcon("LinkIcon", HiLinkIcon);
export const LockIcon = createIcon("LockIcon", HiLockIcon);
export const LogOutIcon = createIcon("LogOutIcon", HiLogOut);
export const MailIcon = createIcon("MailIcon", HiMailIcon);
export const MapPinIcon = createIcon("MapPinIcon", HiMapPinIcon);
export const MenuIcon = createIcon("MenuIcon", HiMenuIcon);
export const MessageSquareIcon = createIcon("MessageSquareIcon", HiMessageSquare);
export const MoonIcon = createIcon("MoonIcon", HiMoonIcon);
export const MoveVerticalIcon = createIcon("MoveVerticalIcon", HiMoveVertical);
export const PencilLineIcon = createIcon("PencilLineIcon", HiPencilLine);
export const PlusIcon = createIcon("PlusIcon", HiPlus);
export const ReceiptIcon = createIcon("ReceiptIcon", HiReceipt);
export const RefreshCcwIcon = createIcon("RefreshCcwIcon", HiRefreshCcw);
export const RefreshCwIcon = createIcon("RefreshCwIcon", HiRefreshCw);
export const RocketIcon = createIcon("RocketIcon", HiRocketIcon);
export const RotateCwIcon = createIcon("RotateCwIcon", HiRotateCw);
export const SaveIcon = createIcon("SaveIcon", HiSave);
export const SearchIcon = createIcon("SearchIcon", HiSearchIcon);
export const Settings2Icon = createIcon("Settings2Icon", HiSettings2);
export const SettingsIcon = createIcon("SettingsIcon", HiSettingsIcon);
export const ShareIcon = createIcon("ShareIcon", HiShareIcon);
export const ShieldCheckIcon = createIcon("ShieldCheckIcon", HiShieldCheck);
export const ShieldIcon = createIcon("ShieldIcon", HiShieldIcon);
export const SparklesIcon = createIcon("SparklesIcon", HiSparklesIcon);
export const StarIcon = createIcon("StarIcon", HiStarIcon);
export const SunIcon = createIcon("SunIcon", HiSunIcon);
export const TerminalIcon = createIcon("TerminalIcon", HiTerminal);
export const TerminalSquareIcon = createIcon("TerminalSquareIcon", HiComputerTerminalIcon);
export const Trash2Icon = createIcon("Trash2Icon", HiTrash2);
export const TrendingUpIcon = createIcon("TrendingUpIcon", HiTrendingUp);
export const UserIcon = createIcon("UserIcon", HiUserIcon);
export const UserPlus2Icon = createIcon("UserPlus2Icon", HiUserAdd02Icon);
export const UsersIcon = createIcon("UsersIcon", HiUsers);
export const XIcon = createIcon("XIcon", HiX);
export const ZapIcon = createIcon("ZapIcon", HiZapIcon);
