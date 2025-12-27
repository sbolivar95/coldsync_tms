import { useState, useMemo } from "react";
import { Search, Filter, AlertTriangle } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

interface CandidateVehicle {
  id: string;
  plate: string;      // RMQ-456
  unitId: string;     // TRK-1024
  driver: string;     // Michael Johnson
  carrier: string;    // COLDCHAIN EXPRESS
  status: "active" | "inactive" | "warning" | "hollow" | "on-route";
  isHybrid: boolean;
  hasWarning: boolean;
  score: number;      // Match score (0-100)
  inRoute?: boolean;
}

export const mockCandidates: CandidateVehicle[] = [
  {
    id: "VEH-001",
    unitId: "TRK-1024",
    plate: "RMQ-456",
    driver: "Michael Johnson",
    carrier: "ColdChain Express",
    status: "active",
    isHybrid: false,
    hasWarning: false,
    score: 98,
    inRoute: false,
  },
  {
    id: "VEH-002",
    unitId: "TRK-7145",
    plate: "RMQ-445",
    driver: "Robert Brown",
    carrier: "FrostLine Logistics",
    status: "hollow",
    isHybrid: true,
    hasWarning: true,
    score: 85,
    inRoute: false,
  },
  {
    id: "VEH-006",
    unitId: "TRK-2051",
    plate: "RMQ-789",
    driver: "Sarah Williams",
    carrier: "FrostLine Logistics",
    status: "on-route",
    isHybrid: false,
    hasWarning: false,
    score: 92,
    inRoute: true,
  },
  {
    id: "VEH-009",
    unitId: "TRK-9201",
    plate: "RMQ-345",
    driver: "Carlos Rodriguez",
    carrier: "FrostLine Logistics",
    status: "hollow",
    isHybrid: false,
    hasWarning: false,
    score: 45,
    inRoute: false,
  },
  {
    id: "VEH-003",
    unitId: "TRK-6234",
    plate: "RMQ-123",
    driver: "Emma Davis",
    carrier: "Arctic Transport",
    status: "inactive", // red
    isHybrid: false,
    hasWarning: false,
    score: 10,
    inRoute: true,
  },
  {
    id: "VEH-004",
    unitId: "TRK-3012",
    plate: "RMQ-234",
    driver: "Mike Chen",
    carrier: "Arctic Transport",
    status: "hollow",
    isHybrid: false,
    hasWarning: false,
    score: 60,
  },
   {
    id: "VEH-005",
    unitId: "TRK-5123",
    plate: "RMQ-890",
    driver: "James Wilson",
    carrier: "Glacier Hauling",
    status: "hollow",
    isHybrid: false,
    hasWarning: true,
    score: 75,
  },
];

interface ReassignViewProps {
  onSelect: (vehicleId: string) => void;
  selectedVehicleId?: string;
}

export function ReassignView({ onSelect, selectedVehicleId }: ReassignViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sort candidates: Best match (score) first
  const sortedCandidates = useMemo(() => {
    return [...mockCandidates].sort((a, b) => b.score - a.score);
  }, []);

  const filteredCandidates = sortedCandidates.filter((c) => {
    if (searchQuery && 
        !c.unitId.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !c.driver.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.plate.toLowerCase().includes(searchQuery.toLowerCase())
       ) {
      return false;
    }
    return true;
  });

  // Group by carrier
  const groupedCandidates = useMemo(() => {
    const groups: { [key: string]: CandidateVehicle[] } = {};
    filteredCandidates.forEach(c => {
      if (!groups[c.carrier]) groups[c.carrier] = [];
      groups[c.carrier].push(c);
    });
    return groups;
  }, [filteredCandidates]);

  const renderStatusDot = (status: string) => {
    switch (status) {
      case "active": return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case "inactive": return <div className="w-2 h-2 rounded-full bg-red-500" />;
      case "warning": return <div className="w-2 h-2 rounded-full bg-amber-500" />;
      case "on-route": return <div className="w-2 h-2 rounded-full bg-blue-500" />;
      default: return <div className="w-2 h-2 rounded-full border border-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar - Clean style */}
      <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar unidad..."
            className="pl-8 bg-gray-50 border-gray-200 h-8 text-xs focus-visible:ring-1 focus-visible:ring-[#004ef0]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500">
           <Filter className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedCandidates).map(([carrier, candidates]) => (
          <div key={carrier}>
            {/* Carrier Header */}
            <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                {carrier}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {candidates.length}
              </span>
            </div>

            {/* Candidates */}
            <div>
              {candidates.map((candidate) => {
                const isSelected = selectedVehicleId === candidate.id;
                const isDisabled = candidate.inRoute;
                
                return (
                  <div
                    key={candidate.id}
                    onClick={() => !isDisabled && onSelect(candidate.id)}
                    className={`
                      group relative px-4 py-3 flex items-start gap-3 border-b border-gray-50 transition-all
                      ${isDisabled ? "opacity-60 cursor-not-allowed bg-gray-50" : "cursor-pointer hover:bg-gray-50"}
                      ${isSelected ? "bg-blue-50/50" : ""}
                    `}
                  >
                    {/* Selection Indicator Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#004ef0]" />
                    )}

                    {/* Status Dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      {renderStatusDot(candidate.status)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isDisabled ? "text-gray-500" : "text-gray-900"}`}>
                          {candidate.unitId}
                        </span>
                        <span className="text-sm text-gray-400 font-normal">
                          {candidate.plate}
                        </span>
                        
                        {/* Tags */}
                        {candidate.inRoute && (
                          <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-blue-100 text-blue-700 font-semibold rounded-sm">
                            EN RUTA
                          </Badge>
                        )}
                        
                        {candidate.isHybrid && !candidate.inRoute && (
                          <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-sm">
                            HYB
                          </Badge>
                        )}

                        {/* Best Match Badge (Visual aid for "Best Match") */}
                        {candidate.score > 90 && !candidate.inRoute && (
                          <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold rounded-sm ml-auto">
                            {candidate.score}% Match
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 truncate flex items-center justify-between">
                        <span>{candidate.driver}</span>
                        {candidate.hasWarning && !candidate.inRoute && (
                           <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {Object.keys(groupedCandidates).length === 0 && (
           <div className="flex flex-col items-center justify-center py-10 text-gray-400">
             <span className="text-xs">No se encontraron unidades</span>
           </div>
        )}
      </div>
    </div>
  );
}
