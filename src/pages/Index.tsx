import { useState } from "react";
import StateNavigator from "@/components/dashboard/StateNavigator";
import MapPanel from "@/components/dashboard/MapPanel";
import AIInsights from "@/components/dashboard/AIInsights";
import KPIRibbon from "@/components/dashboard/KPIRibbon";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const Index = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<string>("infrastructure");

  return (
    <div className="min-h-screen bg-dashboard-bg text-foreground flex flex-col">
      <DashboardHeader />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - State Navigator */}
        <StateNavigator 
          selectedState={selectedState}
          onSelectState={setSelectedState}
        />
        
        {/* Center - Map Panel */}
        <MapPanel 
          selectedState={selectedState}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
        />
        
        {/* Right Panel - AI Insights */}
        <AIInsights selectedState={selectedState} />
      </div>
      
      {/* Bottom - KPI Ribbon */}
      <KPIRibbon />
    </div>
  );
};

export default Index;
