import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Car,
  ChevronRight,
  DollarSign,
  Shield,
  Upload,
  Lock,
  CheckCircle,
  Eye,
  Users,
  Zap,
  BadgeCheck,
  FileType,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import { StatsCounter } from "@/components/stats-counter";
import { TestimonialSlider } from "@/components/testimonial-slider";
import { DashcamPreview } from "@/components/dashcam-preview";
import { EarningsCalculator } from "@/components/earnings-calculator";
import { DatasetPreview } from "@/components/dataset-preview";
import { Header } from "@/components/header";
import { AIDetectionDemo } from "@/components/ai-detection-demo";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 md:pt-32">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center min-h-[600px]">
            <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 leading-tight">
                  Turn Your Dashcam Into Passive Income
                </h1>
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Turn your existing dashcam footage into passive income. Simply
                  upload your rideshare videos - we handle the AI processing and
                  anonymization. Earn $50-150/month from footage you're already
                  recording.
                </p>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Privacy Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>No Equipment Needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-500" />
                  <span>Secure Upload</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Start Earning as Driver
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-purple-500 text-purple-500 hover:bg-purple-950 text-lg px-8 py-4"
                  >
                    Buy AI Training Data
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Supported formats */}
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileType className="h-4 w-4 text-green-500" />
                  Supported Formats
                </h4>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span className="bg-gray-800 px-2 py-1 rounded">MP4</span>
                  <span className="bg-gray-800 px-2 py-1 rounded">MOV</span>
                  <span className="bg-gray-800 px-2 py-1 rounded">AVI</span>
                  <span className="bg-gray-800 px-2 py-1 rounded">MKV</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-3 rounded-lg bg-gray-900/50 backdrop-blur border border-gray-800">
                  <StatsCounter
                    end={2500}
                    suffix="+"
                    className="text-xl font-bold text-blue-500"
                  />
                  <span className="text-xs text-gray-400">Active Drivers</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-gray-900/50 backdrop-blur border border-gray-800">
                  <StatsCounter
                    prefix="$"
                    end={89}
                    className="text-xl font-bold text-purple-500"
                  />
                  <span className="text-xs text-gray-400">Avg Monthly</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-gray-900/50 backdrop-blur border border-gray-800">
                  <StatsCounter
                    end={45}
                    suffix="K"
                    className="text-xl font-bold text-green-500"
                  />
                  <span className="text-xs text-gray-400">Hours Processed</span>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <DashcamPreview />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-purple-900/20 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 to-transparent"></div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gray-950/50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="max-w-[700px] text-gray-400 md:text-xl mx-auto leading-relaxed">
                A simple three-step process to turn your existing footage into
                passive income
              </p>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-3 mb-16">
            <Card className="bg-gray-900 border-gray-800 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-700"></div>
              <CardContent className="p-8">
                <div className="mb-6 rounded-full bg-blue-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">
                  1. Upload Your Files
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  Upload your existing dashcam files (MP4, MOV, AVI). No special
                  equipment or direct camera connection needed.
                </p>
                <div className="flex justify-center space-x-2 text-xs text-gray-500">
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    Drag & Drop
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    Bulk Upload
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-0 group-hover:w-full transition-all duration-300"></div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-700"></div>
              <CardContent className="p-8">
                <div className="mb-6 rounded-full bg-purple-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <Eye className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">
                  2. AI Processing
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  Our AI detects vehicles, pedestrians, traffic signs, lane
                  changes, and road conditions while anonymizing all faces and
                  license plates.
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <span className="bg-gray-800 px-2 py-1 rounded text-center">
                    Vehicle Detection
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-center">
                    Lane Analysis
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-center">
                    Sign Recognition
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-center">
                    Privacy Blur
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-purple-500 w-0 group-hover:w-full transition-all duration-300"></div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-700"></div>
              <CardContent className="p-8">
                <div className="mb-6 rounded-full bg-green-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">
                  3. Earn Passive Income
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  Get paid directly for uploading quality dashcam footage. Earn
                  $50-150 monthly without changing your routine - just upload
                  your existing videos.
                </p>
                <div className="flex justify-center space-x-2 text-xs text-gray-500">
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    Direct Payments
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    Upload & Earn
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-green-500 w-0 group-hover:w-full transition-all duration-300"></div>
              </CardContent>
            </Card>
          </div>

          {/* AI Processing Visualization */}
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
            <h3 className="text-2xl font-bold text-center mb-8">
              AI Detection in Action
            </h3>
            <AIDetectionDemo />
          </div>
        </div>
      </section>

      {/* Dual Value Proposition */}
      <section className="py-16 md:py-24 bg-gray-950">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <Tabs defaultValue="drivers" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-gray-900">
                <TabsTrigger
                  value="drivers"
                  className="data-[state=active]:bg-blue-600"
                >
                  For Drivers
                </TabsTrigger>
                <TabsTrigger
                  value="buyers"
                  className="data-[state=active]:bg-purple-600"
                >
                  For Buyers
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="drivers" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Earn Passive Income While You Drive
                  </h2>
                  <p className="text-gray-400">
                    Turn your everyday driving into a steady stream of passive
                    income with minimal effort
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500/10 p-1 mt-1">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Passive Income</h3>
                        <p className="text-sm text-gray-400">
                          Earn $50-150 monthly without changing your routine
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500/10 p-1 mt-1">
                        <Shield className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Privacy Protection</h3>
                        <p className="text-sm text-gray-400">
                          All footage is anonymized to protect you and others
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500/10 p-1 mt-1">
                        <Camera className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Real-time Tracking</h3>
                        <p className="text-sm text-gray-400">
                          Monitor your earnings and footage status in real-time
                        </p>
                      </div>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Link href="/auth">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Start Earning Now
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="lg:ml-auto">
                  <EarningsCalculator />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="buyers" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <DatasetPreview />
                </div>
                <div className="space-y-4 order-1 lg:order-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    High-Quality Training Data for AV Companies
                  </h2>
                  <p className="text-gray-400">
                    Access diverse, real-world driving data to train and improve
                    your autonomous systems
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-purple-500/10 p-1 mt-1">
                        <Car className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Diverse Real-World Data</h3>
                        <p className="text-sm text-gray-400">
                          Access footage from various environments and
                          conditions
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-purple-500/10 p-1 mt-1">
                        <Shield className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Pre-processed & Anonymized
                        </h3>
                        <p className="text-sm text-gray-400">
                          All data is cleaned, tagged, and privacy-compliant
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="rounded-full bg-purple-500/10 p-1 mt-1">
                        <Camera className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Scenario-specific Filtering
                        </h3>
                        <p className="text-sm text-gray-400">
                          Find exactly the training data your models need
                        </p>
                      </div>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                      <p className="text-sm font-medium">Example Pricing:</p>
                      <p className="text-xs text-gray-400">
                        Urban Intersections: 500 hours • $200/hour
                      </p>
                      <p className="text-xs text-gray-400">
                        Highway Merging: 300 hours • $180/hour
                      </p>
                    </div>
                    <Link href="/auth">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        Request Data Access
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Trusted by Drivers & Companies
              </h2>
              <p className="max-w-[600px] text-gray-400 md:text-xl mx-auto">
                Join thousands of drivers and leading autonomous vehicle
                companies
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
            <div className="flex flex-col items-center p-4 rounded-lg bg-gray-900/50">
              <StatsCounter
                end={2500}
                suffix="+"
                className="text-2xl font-bold text-blue-500"
              />
              <span className="text-sm text-gray-400">Total Drivers</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-gray-900/50">
              <StatsCounter
                prefix="$"
                end={89}
                className="text-2xl font-bold text-purple-500"
              />
              <span className="text-sm text-gray-400">Avg Earnings</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-gray-900/50">
              <StatsCounter
                end={45000}
                suffix="+"
                className="text-2xl font-bold text-green-500"
              />
              <span className="text-sm text-gray-400">Hours of Footage</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-gray-900/50">
              <StatsCounter
                end={12}
                className="text-2xl font-bold text-blue-500"
              />
              <span className="text-sm text-gray-400">AV Companies</span>
            </div>
          </div>

          <div className="mt-16">
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 w-32 bg-gray-800 rounded-md flex items-center justify-center"
                >
                  <span className="text-gray-500 text-sm font-medium">
                    COMPANY {i}
                  </span>
                </div>
              ))}
            </div>

            <TestimonialSlider />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-black">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Your Driving Experience?
              </h2>
              <p className="text-gray-300 md:text-xl">
                Join DashCache today and start earning passive income from your
                dashcam footage or access high-quality training data for your
                autonomous systems.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link href="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Earning as Driver
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-500 text-purple-500 hover:bg-purple-950"
                >
                  Buy AI Training Data
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12 md:py-16 border-t border-gray-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">For Drivers</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Earnings Calculator
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">For Buyers</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Data Catalog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Custom Datasets
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    API Access
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Enterprise
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-blue-500" />
              <span className="font-bold text-xl">DashCache</span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="#" className="text-gray-400 hover:text-white">
                <div className="h-5 w-5 bg-gray-400 rounded-sm"></div>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <div className="h-5 w-5 bg-gray-400 rounded-sm"></div>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <div className="h-5 w-5 bg-gray-400 rounded-sm"></div>
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <div className="h-5 w-5 bg-gray-400 rounded-sm"></div>
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="Subscribe to newsletter"
                className="max-w-[200px] bg-gray-900 border-gray-800"
              />
              <Button variant="secondary" size="sm">
                Subscribe
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} DashCache. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
