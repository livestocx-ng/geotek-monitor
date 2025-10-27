import { Droplet, Activity, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DashboardHeader = () => {
  return (
    <header className="h-16 bg-dashboard-panel border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-water-primary to-water-secondary flex items-center justify-center">
          <Droplet className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">GEOTEK MONITOR</h1>
          <p className="text-xs text-muted-foreground">National Water Intelligence System</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-metric-success animate-pulse-glow" />
          <span className="text-sm text-muted-foreground">System Online</span>
        </div>
        
        <div className="relative">
          <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-metric-danger text-[10px]">
            3
          </Badge>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
