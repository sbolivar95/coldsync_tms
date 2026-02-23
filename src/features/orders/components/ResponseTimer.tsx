import { useState, useEffect } from "react";

interface ResponseTimerProps {
    deadline: Date;
}

export function ResponseTimer({ deadline }: ResponseTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [urgency, setUrgency] = useState<"normal" | "high" | "critical">("normal");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const diffMs = deadline.getTime() - now.getTime();

            if (diffMs <= 0) {
                setTimeLeft("Expirado");
                setUrgency("critical");
                return;
            }

            // Calculate urgency based on remaining time
            // < 2 hours: critical
            // < 6 hours: high
            // > 6 hours: normal
            const hoursRemaining = diffMs / (1000 * 60 * 60);

            if (hoursRemaining < 2) {
                setUrgency("critical");
            } else if (hoursRemaining < 6) {
                setUrgency("high");
            } else {
                setUrgency("normal");
            }

            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}min`);
            } else {
                setTimeLeft(`${minutes}min`);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [deadline]);

    const getColorClass = () => {
        switch (urgency) {
            case "critical":
                return "text-red-600 font-semibold";
            case "high":
                return "text-amber-600 font-medium";
            default:
                return "text-gray-500";
        }
    };

    return (
        <span className={`text-xs ${getColorClass()} ml-3.5`}>
            {timeLeft === "Expirado" ? "Expiró" : `Vence en ${timeLeft}`}
        </span>
    );
}
