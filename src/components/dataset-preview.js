"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Clock, CloudRain, MapPin, RouteIcon as Road, Sun } from "lucide-react"

export function DatasetPreview() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <Tabs defaultValue="urban">
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="urban">Urban</TabsTrigger>
            <TabsTrigger value="highway">Highway</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
          </TabsList>
          
          <TabsContent value="urban" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Urban Intersections</h3>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  500+ hours
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-white/70" />
                    <span className="text-xs text-white/70">Downtown</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                      4-way
                    </Badge>
                  </div>
                </div>
                
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-white/70" />
                    <span className="text-xs text-white/70">Residential</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      T-junction
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Dataset Features</h4>
                <ul className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-gray-300">
                  <li className="flex items-center gap-1">
                    <Road className="h-3 w-3 text-purple-500" />
                    <span>Traffic signals</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-purple-500" />
                    <span>Pedestrian crossings</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-purple-500" />
                    <span>Day/night footage</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-purple-500" />
                    <span>Various lighting</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="highway" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Highway Merging</h3>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  300+ hours
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <Car className="h-3 w-3 text-white/70" />
                    <span className="text-xs text-white/70">On-ramp</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                      High traffic
                    </Badge>
                  </div>
                </div>
                
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <Car className="h-3 w-3 text-white/70" />
                    <span className="text-xs text-white/70">Lane change</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      Low traffic
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Dataset Features</h4>
                <ul className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-gray-300">
                  <li className="flex items-center gap-1">
                    <Road className="h-3 w-3 text-purple-500" />
                    <span>Merging scenarios</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-purple-500" />
                    <span>Lane changes</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-purple-500" />
                    <span>Rush hour traffic</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-purple-500" />
                    <span>Various speeds</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="weather" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Weather Conditions</h3>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  200+ hours
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <CloudRain className="h-3 w-3 text-white/70" />
                    <span className="text-xs text-white/70">Heavy rain</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Urban
                    </Badge>
                  </div>
                </div>
                
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <CloudRain className="h-3 w-3 text-white/70" />
                    <span className="text-xs text-white/70">Fog</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      Highway
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Dataset Features</h4>
                <ul className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-gray-300">
                  <li className="flex items-center gap-1">
                    <CloudRain className="h-3 w-3 text-purple-500" />
                    <span>Rain conditions</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <CloudRain className="h-3 w-3 text-purple-500" />
                    <span>Fog visibility</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-purple-500" />
                    <span>Glare conditions</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <CloudRain className="h-3 w-3 text-purple-500" />
                    <span>Wet roads</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}