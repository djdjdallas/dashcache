import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Camera,
  DollarSign,
  Shield,
  Upload,
  CheckCircle,
  Users,
  Star,
  Lock,
  Zap,
  ArrowRight,
  Play
} from "lucide-react"
import Link from "next/link"
import { StatsCounter } from "@/components/stats-counter"
import { CountdownTimer } from "@/components/coming-soon/countdown-timer"
import { WaitlistForm } from "@/components/coming-soon/waitlist-form"
import { EarlyAccessBenefits } from "@/components/coming-soon/early-access-benefits"
import { FAQAccordion } from "@/components/coming-soon/faq-accordion"
import { ProgressIndicator } from "@/components/coming-soon/progress-indicator"
import { ExitIntentPopup } from "@/components/coming-soon/exit-intent-popup"

export default function ComingSoonPage() {
  // Target launch date (adjust as needed)
  const launchDate = new Date("2025-05-15T00:00:00Z")

  return (
    <div className="min-h-screen bg-black text-white">
      <ExitIntentPopup />
      
      {/* Header with Coming Soon Banner */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        {/* Countdown Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-2">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>Early Access launches in:</span>
              <CountdownTimer targetDate={launchDate} className="text-xs" />
            </div>
          </div>
        </div>
        
        {/* Main Header */}
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-xl">DashCache</span>
            <span className="text-sm text-blue-400 ml-2">Coming Soon</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white">How It Works</a>
            <a href="#benefits" className="text-sm text-gray-300 hover:text-white">Benefits</a>
            <a href="#faq" className="text-sm text-gray-300 hover:text-white">FAQ</a>
            <a href="mailto:drivers@dashcache.com" className="text-sm text-gray-300 hover:text-white">Contact</a>
          </nav>

          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <a href="#waitlist">Join Waitlist</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent leading-tight">
                Turn Your Daily Drives Into Passive Income
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Join 1,000+ drivers earning $30-100/month by sharing anonymized dashcam footage with autonomous vehicle companies
              </p>
            </div>

            {/* Earnings Callout */}
            <div className="bg-gradient-to-r from-green-950/50 to-blue-950/50 border border-green-500/30 rounded-2xl p-6 mb-8 max-w-md mx-auto">
              <div className="text-3xl font-bold text-green-400 mb-2">
                <StatsCounter prefix="$" end={89} className="text-3xl font-bold text-green-400" />
                <span className="text-lg text-gray-400 ml-2">Average Monthly Earnings</span>
              </div>
              <p className="text-sm text-green-300">Based on beta testing with 500+ drivers</p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                <a href="#waitlist" className="flex items-center">
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-4">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <StatsCounter end={2847} className="text-2xl font-bold text-blue-400" />
                <p className="text-sm text-gray-400 mt-1">Drivers on Waitlist</p>
              </div>
              <div className="text-center">
                <StatsCounter end={45} suffix="K" className="text-2xl font-bold text-purple-400" />
                <p className="text-sm text-gray-400 mt-1">Hours Tested</p>
              </div>
              <div className="text-center">
                <StatsCounter prefix="$" end={1.2} suffix="M" className="text-2xl font-bold text-green-400" />
                <p className="text-sm text-gray-400 mt-1">Paid to Drivers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-purple-900/20 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/10 to-transparent"></div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-16 md:py-24 bg-gray-950/50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why Drivers Choose DashCache
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border-gray-700 text-center p-8 hover:shadow-2xl transition-all duration-300 hover:border-blue-500/50">
              <CardContent className="p-0">
                <div className="mb-6 rounded-full bg-green-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">💰 Passive Income</h3>
                <p className="text-gray-400">
                  Earn money from footage you're already recording. No extra work required. Just drive and earn.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 text-center p-8 hover:shadow-2xl transition-all duration-300 hover:border-green-500/50">
              <CardContent className="p-0">
                <div className="mb-6 rounded-full bg-blue-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">🛡️ 100% Anonymous</h3>
                <p className="text-gray-400">
                  All faces and license plates automatically blurred. Your privacy protected with bank-level security.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 text-center p-8 hover:shadow-2xl transition-all duration-300 hover:border-purple-500/50">
              <CardContent className="p-0">
                <div className="mb-6 rounded-full bg-purple-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">📱 Set & Forget</h3>
                <p className="text-gray-400">
                  Upload once, earn forever. Simple app handles everything automatically with smart uploads.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A simple three-step process to turn your existing footage into passive income
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Camera className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">1. Record</h3>
              <p className="text-gray-400">Use your existing dashcam while driving for rideshare. No special equipment needed.</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Upload className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">2. Upload</h3>
              <p className="text-gray-400">Our app automatically uploads safely and processes footage with AI anonymization.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-950/30 border border-green-500/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">3. Earn</h3>
              <p className="text-gray-400">Get paid monthly via direct deposit. Track earnings in real-time through our dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Benefits */}
      <section id="benefits" className="py-16 md:py-24 bg-gray-950/50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <EarlyAccessBenefits />
            <ProgressIndicator current={347} total={500} />
          </div>
        </div>
      </section>

      {/* Waitlist Signup */}
      <section id="waitlist" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <WaitlistForm />
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-16 md:py-24 bg-gray-950/50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            What Drivers Are Saying
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border-gray-700 p-6">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                  </div>
                  <div>
                    <div className="font-semibold">Marcus</div>
                    <div className="text-sm text-gray-400">San Francisco</div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  "Finally, a way to make money from something I was doing anyway! The privacy protection gives me peace of mind."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 p-6">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <div>
                    <div className="font-semibold">Sarah</div>
                    <div className="text-sm text-gray-400">New York City</div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  "Easy extra income during slow rideshare periods. The beta earnings have been consistently good."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 p-6">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">D</span>
                  </div>
                  <div>
                    <div className="font-semibold">David</div>
                    <div className="text-sm text-gray-400">Chicago</div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  "Set it and forget it! Upload takes seconds and the payouts are reliable. Love the transparency."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Supported Dashcam Brands */}
          <div className="mt-16 text-center">
            <h3 className="text-lg font-semibold mb-8 text-gray-300">Supported Dashcam Brands</h3>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
              {["Garmin", "Nextbase", "BlackVue", "Thinkware", "Viofo"].map((brand, i) => (
                <div key={i} className="bg-gray-800 px-6 py-3 rounded-lg">
                  <span className="text-gray-400 font-medium">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <FAQAccordion />
        </div>
      </section>

      {/* Trust & Security Bar */}
      <section className="py-12 bg-gray-950">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Security is Our Priority</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400">Bank-Level Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-400">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              <span className="text-gray-400">SOC 2 Certified</span>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            Your data is never sold to third parties. Complete privacy protection guaranteed.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-green-900/30">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join the waitlist now and be among the first drivers to turn your daily commute into passive income.
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
            <a href="#waitlist">Reserve Your Spot Now</a>
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            🎁 Refer friends and earn $25 bonus for each successful signup
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-blue-500" />
              <span className="font-bold text-xl">DashCache</span>
              <span className="text-sm text-gray-500">Coming Soon</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="mailto:drivers@dashcache.com" className="hover:text-white">Contact</a>
            </div>

            <div className="text-sm text-gray-500">
              Questions? Email us at{" "}
              <a href="mailto:drivers@dashcache.com" className="text-blue-400 hover:underline">
                drivers@dashcache.com
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} DashCache. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-900 border-t border-gray-700 p-4 z-40">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 py-3">
          <a href="#waitlist">Join Waitlist - Get $25 Bonus</a>
        </Button>
      </div>
    </div>
  )
}