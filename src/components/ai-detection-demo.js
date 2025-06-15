"use client"

import { useEffect, useRef, useState } from "react"
import { Car, Users, Monitor, Zap, Shield, BadgeCheck, CheckCircle, Clock } from "lucide-react"

export function AIDetectionDemo() {
  const [detections, setDetections] = useState([])
  const [processingComplete, setProcessingComplete] = useState(false)
  const videoRef = useRef(null)

  // Simulate AI detections appearing over time
  useEffect(() => {
    const detectionSequence = [
      { id: "demo-1", type: "vehicle", x: "30%", y: "50%", width: "120px", height: "80px", label: "Vehicle", color: "blue", delay: 1500 },
      { id: "demo-2", type: "vehicle", x: "60%", y: "45%", width: "90px", height: "60px", label: "Car", color: "blue", delay: 2500 },
      { id: "demo-3", type: "sign", x: "75%", y: "25%", width: "60px", height: "60px", label: "Traffic Sign", color: "yellow", delay: 3000 },
      { id: "demo-4", type: "lane", x: "20%", y: "75%", width: "180px", height: "25px", label: "Lane Marking", color: "green", delay: 3500 },
      { id: "demo-5", type: "lane", x: "50%", y: "80%", width: "160px", height: "20px", label: "Road Edge", color: "green", delay: 4000 },
      { id: "demo-6", type: "privacy", x: "15%", y: "40%", width: "40px", height: "30px", label: "Privacy Blur", color: "red", delay: 4500 },
    ]

    const timeouts = []
    
    detectionSequence.forEach((detection) => {
      const timeout = setTimeout(() => {
        setDetections(prev => [...prev, detection])
      }, detection.delay)
      timeouts.push(timeout)
    })

    // Mark processing as complete
    const completeTimeout = setTimeout(() => setProcessingComplete(true), 5500)
    timeouts.push(completeTimeout)

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      setDetections([])
      setProcessingComplete(false)
    }
  }, [])

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div className="relative">
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative border border-gray-700 shadow-xl">
          {/* Real dashcam video */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/assets/1666547-hd_1920_1080_30fps.mp4" type="video/mp4" />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-white text-sm">Video not supported</span>
            </div>
          </video>

          {/* Dark overlay for better contrast */}
          <div className="absolute inset-0 bg-black/30"></div>

          {/* Processing indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs text-white font-bold drop-shadow-lg">
              {processingComplete ? "ANALYZED" : "PROCESSING"}
            </span>
          </div>

          {/* Timestamp */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            <Clock className="h-3 w-3 text-white/80" />
            <span className="text-xs text-white/80 font-medium">Live Feed</span>
          </div>

          {/* AI Detection boxes - animated */}
          {detections.map((detection) => (
            <div key={detection.id}>
              {detection.type === "privacy" ? (
                // Privacy blur area
                <div
                  className="absolute bg-gray-600 blur-sm rounded animate-pulse"
                  style={{
                    left: detection.x,
                    top: detection.y,
                    width: detection.width,
                    height: detection.height,
                  }}
                >
                  <div className="absolute -top-5 left-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded text-center font-medium">
                    Blurred
                  </div>
                </div>
              ) : (
                // Regular detection box
                <div
                  className={`absolute border-2 rounded-sm transition-all duration-500 ease-in-out ${
                    detection.color === "blue" ? "border-blue-400" :
                    detection.color === "yellow" ? "border-yellow-400" :
                    detection.color === "green" ? "border-green-400" :
                    "border-red-400"
                  } animate-pulse`}
                  style={{
                    left: detection.x,
                    top: detection.y,
                    width: detection.width,
                    height: detection.height,
                  }}
                >
                  <div className={`absolute -top-5 left-0 text-white text-xs px-1 py-0.5 rounded font-medium ${
                    detection.color === "blue" ? "bg-blue-400" :
                    detection.color === "yellow" ? "bg-yellow-400" :
                    detection.color === "green" ? "bg-green-400" :
                    "bg-red-400"
                  }`}>
                    {detection.label}
                  </div>
                  {/* Confidence score */}
                  <div className={`absolute -bottom-4 left-0 text-xs font-bold ${
                    detection.color === "blue" ? "text-blue-300" :
                    detection.color === "yellow" ? "text-yellow-300" :
                    detection.color === "green" ? "text-green-300" :
                    "text-red-300"
                  }`}>
                    {Math.floor(Math.random() * 10 + 90)}%
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Lane detection overlay */}
          <div className="absolute bottom-1/4 left-0 right-0 pointer-events-none opacity-70">
            <svg className="w-full h-16" viewBox="0 0 400 64">
              <path
                d="M0 45 Q200 35 400 45"
                stroke="#10b981"
                strokeWidth="2"
                fill="none"
                strokeDasharray="8,4"
                className="animate-pulse"
              />
              <path
                d="M0 55 Q200 45 400 55"
                stroke="#10b981"
                strokeWidth="2"
                fill="none"
                strokeDasharray="8,4"
                className="animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
            </svg>
          </div>

          {/* Analysis complete indicator */}
          {processingComplete && (
            <div className="absolute bottom-2 left-2 right-2 bg-green-900/80 border border-green-700 rounded p-2 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-green-300 font-medium">Analysis Complete</span>
                </div>
                <span className="text-green-300">{detections.length} objects detected</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xl font-semibold">What Our AI Detects:</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-blue-400" />
            <span>Vehicles & Traffic</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-green-400" />
            <span>Pedestrians</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="h-4 w-4 text-yellow-400" />
            <span>Traffic Signs</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-purple-400" />
            <span>Lane Changes</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-red-400" />
            <span>Privacy Blur</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BadgeCheck className="h-4 w-4 text-green-500" />
            <span>Road Conditions</span>
          </div>
        </div>
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">100% Anonymized</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">All faces, license plates, and personal information automatically blurred</p>
        </div>

        {/* Live stats */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <h5 className="text-sm font-medium mb-2">Live Detection Stats</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Vehicles detected:</span>
              <span className="text-blue-400 font-medium">{detections.filter(d => d.type === "vehicle").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Traffic signs:</span>
              <span className="text-yellow-400 font-medium">{detections.filter(d => d.type === "sign").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lane markings:</span>
              <span className="text-green-400 font-medium">{detections.filter(d => d.type === "lane").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Privacy areas:</span>
              <span className="text-red-400 font-medium">{detections.filter(d => d.type === "privacy").length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}