import fs from 'node:fs';
const code = fs.readFileSync('src/pages/Landing.jsx', 'utf8');
const icons = ['Svg','ArrowRight','Play','Check','ChevronRight','Sparkles','Brain','Zap','Target','TrendingUp','Rocket','Shield','BarChart3','Globe','Layers','Cpu','Database','Code','Quote','LayoutDashboard','UsersIcon','Building','CalendarIcon','FileText','Receipt','SettingsIcon','CarIcon','UploadIcon','DownloadIcon','PlusIcon','XClose','SearchIcon','LogOutIcon','Wrench','PhoneIcon','MailIcon','BellIcon','ClockIcon','AlertTriangle','ArchiveIcon','ActivityIcon','PaletteIcon','EditIcon','EyeIcon','FolderIcon','ImageIcon','PinIcon','MessageIcon','CheckSquare','HashIcon','QrCodeIcon','ClipboardIcon','ScaleIcon','ShieldIcon','UserPlusIcon','TrashIcon','GlobeIcon','InfinityIcon','UsersGroupIcon','RadioTowerIcon','FolderCheckIcon','CameraIcon','GridIcon','MaximizeIcon'];
const used = [];
for (const icon of icons) {
  // Kullanim ortuntuleri: <Icon, Icon(, : Icon (deger olarak), [Icon, Icon}, Icon,
  const re = new RegExp(`(<${icon}\\b|\\b${icon}\\s*\\(|:\\s*${icon}\\b|\\[\\s*${icon}\\b|\\b${icon}\\s*[},\\]])`, 'g');
  if (re.test(code)) used.push(icon);
}
console.log(used.join(','));
