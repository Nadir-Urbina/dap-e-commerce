import { Badge } from "@/components/ui/badge"

type AvailabilityStatus = "available" | "limited" | "unavailable"

interface ProductAvailabilityProps {
  status: AvailabilityStatus
}

export function ProductAvailability({ status }: ProductAvailabilityProps) {
  const statusConfig = {
    available: {
      color: "bg-green-500",
      text: "Available Now",
      textColor: "text-green-400",
      bgColor: "bg-green-900/50",
      borderColor: "border-green-800",
    },
    limited: {
      color: "bg-amber-500",
      text: "Limited Quantity",
      textColor: "text-amber-400",
      bgColor: "bg-amber-900/50",
      borderColor: "border-amber-800",
    },
    unavailable: {
      color: "bg-red-500",
      text: "Not Available",
      textColor: "text-red-400",
      bgColor: "bg-red-900/50",
      borderColor: "border-red-800",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge className={`px-2 py-1 ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      <div className={`w-2 h-2 mr-1 rounded-full ${config.color}`}></div>
      {config.text}
    </Badge>
  )
}

