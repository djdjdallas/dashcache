"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    id: 1,
    type: "driver",
    name: "Michael T.",
    role: "Rideshare Driver",
    content:
      "I've been using DashCache for 6 months and earn an extra $75-90 each month without changing my driving routine. The app is simple and payments are always on time.",
  },
  {
    id: 2,
    type: "buyer",
    name: "Sarah L.",
    role: "AI Research Lead",
    content:
      "The quality and diversity of DashCache's datasets have significantly improved our AV models' performance in complex urban environments. Their tagging system saves us countless hours.",
  },
  {
    id: 3,
    type: "driver",
    name: "James K.",
    role: "Full-time Driver",
    content:
      "What I appreciate most about DashCache is the transparency. I can see exactly which footage was used and how much I earned from each clip. It's truly passive income.",
  },
  {
    id: 4,
    type: "buyer",
    name: "Elena R.",
    role: "Data Acquisition Manager",
    content:
      "DashCache provides us with real-world edge cases that would be nearly impossible to simulate. Their privacy-first approach also ensures we remain compliant with regulations.",
  },
]

export function TestimonialSlider() {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
          }}
        >
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="min-w-full bg-gray-900 border-gray-800">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col gap-4">
                  <Quote
                    className={cn(
                      "h-8 w-8 opacity-50",
                      testimonial.type === "driver" ? "text-blue-500" : "text-purple-500",
                    )}
                  />
                  <p className="text-gray-300 italic">{testimonial.content}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        testimonial.type === "driver" ? "bg-blue-500/20" : "bg-purple-500/20",
                      )}
                    >
                      <span
                        className={cn("font-bold", testimonial.type === "driver" ? "text-blue-500" : "text-purple-500")}
                      >
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-gray-800 hover:bg-gray-800"
          onClick={prevTestimonial}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous testimonial</span>
        </Button>
        <div className="flex gap-1 items-center">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                activeIndex === index ? "bg-white w-4" : "bg-gray-600 hover:bg-gray-500",
              )}
              onClick={() => setActiveIndex(index)}
            >
              <span className="sr-only">Go to testimonial {index + 1}</span>
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-gray-800 hover:bg-gray-800"
          onClick={nextTestimonial}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next testimonial</span>
        </Button>
      </div>
    </div>
  )
}