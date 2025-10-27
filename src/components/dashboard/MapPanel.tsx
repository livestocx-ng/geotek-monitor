import { Layers, MapPin, Droplets, Activity, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MapPanelProps {
  selectedState: string | null;
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}

const layers = [
  { id: "infrastructure", label: "Infrastructure", icon: MapPin },
  { id: "quality", label: "Water Quality", icon: Droplets },
  { id: "scarcity", label: "Scarcity Risk", icon: AlertCircle },
  { id: "activity", label: "Real-time Activity", icon: Activity },
];

const MapPanel = ({ selectedState, activeLayer, onLayerChange }: MapPanelProps) => {
  return (
    <main className="flex-1 flex flex-col relative">
      {/* Layer Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 transition-all",
                "backdrop-blur-sm border",
                activeLayer === layer.id
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-dashboard-panel/80 border-border hover:bg-dashboard-elevated"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{layer.label}</span>
            </button>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-gradient-to-br from-dashboard-bg via-dashboard-panel to-dashboard-bg">
        {/* Nigeria Map Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Simplified Nigeria shape representation */}
            <svg
              viewBox="0 0 400 400"
              className="w-[600px] h-[600px] opacity-20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                d="M100,80 L300,80 L320,120 L310,200 L280,250 L250,280 L200,300 L150,290 L120,260 L90,200 L80,150 Z"
                className="fill-water-primary/10 stroke-water-primary"
              />
            </svg>
            
            {/* Data points overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => {
                const angle = (i * Math.PI * 2) / 8;
                const radius = 120;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-primary animate-pulse-glow"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* State Info Card (when state is selected) */}
        {selectedState && (
          <Card className="absolute bottom-6 left-1/2 -translate-x-1/2 w-96 p-4 bg-dashboard-panel/95 backdrop-blur-lg border-primary/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{selectedState} State</h3>
                <Badge className="bg-metric-success/20 text-metric-success border-metric-success/30">
                  Active
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Quality Score</div>
                  <div className="text-2xl font-bold text-water-primary">89/100</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Active Sites</div>
                  <div className="text-2xl font-bold">47</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                Last updated: 2 minutes ago
              </div>
            </div>
          </Card>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-dashboard-panel/80 backdrop-blur-sm rounded-lg p-4 border border-border">
          <div className="text-xs font-semibold mb-2">LEGEND</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-metric-success" />
              <span className="text-muted-foreground">Optimal Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-metric-warning" />
              <span className="text-muted-foreground">Moderate Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-metric-danger" />
              <span className="text-muted-foreground">High Risk</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MapPanel;
