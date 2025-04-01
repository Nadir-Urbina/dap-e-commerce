import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

interface TestimonialProps {
  quote: string
  author: string
  company: string
  rating: number
}

export function Testimonial({ quote, author, company, rating }: TestimonialProps) {
  return (
    <Card className="border-0 shadow-md bg-[#121212] text-white">
      <CardContent className="p-6">
        <div className="flex mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < rating ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-gray-700 text-gray-700"}`}
            />
          ))}
        </div>
        <p className="mb-4 italic text-gray-300">"{quote}"</p>
        <div>
          <p className="font-semibold text-[#EFCD00]">{author}</p>
          <p className="text-sm text-gray-400">{company}</p>
        </div>
      </CardContent>
    </Card>
  )
}

