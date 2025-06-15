"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Car, Clock, MapPin, RouteIcon as Road, Users, Monitor } from "lucide-react"

export function DashcamPreview() {
  const [detections, setDetections] = useState([])
  const [processingStatus, setProcessingStatus] = useState("Processing...")
  const videoRef = useRef(null)

  // Simulate AI detections appearing over time
  useEffect(() => {
    const detectionSequence = [
      { id: "preview-1", type: "vehicle", x: "25%", y: "45%", width: "80px", height: "60px", label: "Vehicle", color: "blue", delay: 2000 },
      { id: "preview-2", type: "sign", x: "70%", y: "35%", width: "50px", height: "50px", label: "Stop Sign", color: "red", delay: 3500 },
      { id: "preview-3", type: "vehicle", x: "45%", y: "55%", width: "70px", height: "50px", label: "Vehicle", color: "blue", delay: 4000 },
      { id: "preview-4", type: "lane", x: "10%", y: "70%", width: "200px", height: "30px", label: "Lane Marking", color: "green", delay: 5000 },
      { id: "preview-5", type: "pedestrian", x: "80%", y: "60%", width: "30px", height: "60px", label: "Pedestrian", color: "yellow", delay: 6000 },
    ]

    const timeouts = []

    detectionSequence.forEach((detection) => {
      const timeout = setTimeout(() => {
        setDetections(prev => [...prev, detection])
      }, detection.delay)
      timeouts.push(timeout)
    })

    // Update processing status
    const statusTimeout = setTimeout(() => setProcessingStatus("AI Analysis Complete"), 7000)
    timeouts.push(statusTimeout)

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      setDetections([])
      setProcessingStatus("Processing...")
    }
  }, [])

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Video container */}
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl relative">
        {/* Real dashcam video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assets/2053420-uhd_3840_2160_30fps.mp4" type="video/mp4" />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-white text-sm">Video not supported</span>
          </div>
        </video>

        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Recording indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-bold text-white drop-shadow-lg">LIVE</span>
        </div>

        {/* Timestamp */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <span className="text-xs font-bold text-white drop-shadow-lg">12:42:18</span>
          <Clock className="h-3 w-3 text-white drop-shadow-lg" />
        </div>

        {/* AI Detection boxes - animated */}
        {detections.map((detection) => (
          <div
            key={detection.id}
            className={`absolute border-2 border-${detection.color}-500 rounded-sm animate-pulse transition-all duration-500 ease-in-out`}
            style={{
              left: detection.x,
              top: detection.y,
              width: detection.width,
              height: detection.height,
            }}
          >
            <div className={`absolute -top-6 left-0 bg-${detection.color}-500 text-white text-xs px-2 py-1 rounded font-medium drop-shadow-lg`}>
              {detection.label}
            </div>
            {/* Confidence indicator */}
            <div className={`absolute -bottom-4 left-0 text-${detection.color}-400 text-xs font-bold drop-shadow-lg`}>
              {Math.floor(Math.random() * 15 + 85)}%
            </div>
          </div>
        ))}

        {/* Lane detection overlay */}
        <div className="absolute bottom-1/4 left-0 right-0 pointer-events-none">
          <svg className="w-full h-20" viewBox="0 0 400 80">
            <path
              d="M0 60 Q200 40 400 60"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeDasharray="10,5"
              className="animate-pulse opacity-70"
            />
            <path
              d="M0 70 Q200 50 400 70"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              strokeDasharray="10,5"
              className="animate-pulse opacity-70"
            />
          </svg>
        </div>

        {/* Speed and location info */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-white/70" />
            <span className="text-xs text-white/70">San Francisco, CA</span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="h-3 w-3 text-white/70" />
            <span className="text-xs text-white/70">28 mph</span>
          </div>
        </div>
      </div>

      {/* AI Processing status panel */}
      <div className="absolute -bottom-6 left-4 right-4 bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg p-3 shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-white">AI Processing</span>
          <Badge variant="outline" className={`text-xs border-green-500/20 ${
            processingStatus.includes("Complete") 
              ? "bg-green-500/10 text-green-400" 
              : "bg-yellow-500/10 text-yellow-400"
          }`}>
            {processingStatus.includes("Complete") ? "Complete" : "Live"}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1">
            <Car className="h-3 w-3 text-blue-400" />
            <span className="text-xs text-gray-300">Vehicles: {detections.filter(d => d.type === "vehicle").length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Monitor className="h-3 w-3 text-red-400" />
            <span className="text-xs text-gray-300">Signs: {detections.filter(d => d.type === "sign").length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-gray-300">People: {detections.filter(d => d.type === "pedestrian").length}</span>
          </div>
        </div>
      </div>

      {/* Scenario tags */}
      <div className="absolute -right-6 top-1/4 bg-blue-600 text-white text-xs py-2 px-3 rounded-lg shadow-lg animate-bounce">
        <div className="flex items-center gap-1">
          <Road className="h-3 w-3" />
          <span className="font-medium">Intersection</span>
        </div>
      </div>

      <div className="absolute -left-6 top-1/2 bg-purple-600 text-white text-xs py-2 px-3 rounded-lg shadow-lg animate-bounce" style={{animationDelay: "1s"}}>
        <div className="flex items-center gap-1">
          <Car className="h-3 w-3" />
          <span className="font-medium">Lane Change</span>
        </div>
      </div>

      {/* Animated gradient background */}
      <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
    </div>
  )
}