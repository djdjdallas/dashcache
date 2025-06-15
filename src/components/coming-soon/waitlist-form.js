"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Loader2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function WaitlistForm({ className }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    rideshareService: "",
    hasDashcam: false,
    agreeToTerms: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.city.trim()) newErrors.city = "City/State is required"
    if (!formData.rideshareService) newErrors.rideshareService = "Please select your rideshare service"
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Waitlist signup:', formData)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className={cn("bg-gray-900 border-green-500/50 shadow-2xl shadow-green-500/10", className)}>
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-500 mb-2">Welcome to DashCache!</h3>
            <p className="text-gray-300">
              You're now on the waitlist. We'll notify you as soon as early access opens.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-lg font-semibold text-blue-400">Position #847</span>
            </div>
            <p className="text-sm text-gray-400">in line for early access</p>
          </div>
          <div className="mt-6 text-sm text-gray-400">
            💝 Check your email for your free DashCache starter guide
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-gray-900 border-gray-700 shadow-2xl shadow-blue-500/10", className)}>
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">Reserve Your Spot</h3>
          <p className="text-gray-400">Join 2,847 drivers already on the waitlist</p>
          <div className="mt-4 bg-blue-950/30 border border-blue-500/20 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-300">🎁 Early Access Bonus</div>
            <div className="text-xs text-blue-400">50% earnings boost for first 3 months</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-300">
                Full Name *
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={cn(
                  "bg-gray-800 border-gray-600 text-white mt-1",
                  errors.fullName && "border-red-500"
                )}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={cn(
                  "bg-gray-800 border-gray-600 text-white mt-1",
                  errors.email && "border-red-500"
                )}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-300">
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={cn(
                  "bg-gray-800 border-gray-600 text-white mt-1",
                  errors.phone && "border-red-500"
                )}
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city" className="text-sm font-medium text-gray-300">
                City, State *
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={cn(
                  "bg-gray-800 border-gray-600 text-white mt-1",
                  errors.city && "border-red-500"
                )}
                placeholder="San Francisco, CA"
              />
              {errors.city && (
                <p className="text-red-400 text-xs mt-1">{errors.city}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="rideshareService" className="text-sm font-medium text-gray-300">
              I drive for *
            </Label>
            <select
              id="rideshareService"
              name="rideshareService"
              value={formData.rideshareService}
              onChange={handleInputChange}
              className={cn(
                "w-full mt-1 bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2",
                errors.rideshareService && "border-red-500"
              )}
            >
              <option value="">Select your service</option>
              <option value="uber">Uber</option>
              <option value="lyft">Lyft</option>
              <option value="both">Both Uber & Lyft</option>
              <option value="other">Other rideshare service</option>
            </select>
            {errors.rideshareService && (
              <p className="text-red-400 text-xs mt-1">{errors.rideshareService}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasDashcam"
                checked={formData.hasDashcam}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">
                I currently use a dashcam (you'll get priority access!)
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">
                I agree to the{" "}
                <a href="#" className="text-blue-400 hover:underline">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-400 hover:underline">
                  Terms of Service
                </a>{" "}
                *
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-red-400 text-xs">{errors.agreeToTerms}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Reserving Your Spot...
              </>
            ) : (
              "Reserve My Spot 🚀"
            )}
          </Button>

          <p className="text-center text-xs text-gray-500">
            By signing up, you'll be among the first to access DashCache and start earning.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}