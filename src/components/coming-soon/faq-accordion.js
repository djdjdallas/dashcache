"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function FAQAccordion({ className }) {
  const [openItems, setOpenItems] = useState(new Set([0])) // First item open by default

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  const faqs = [
    {
      question: "Is my privacy protected?",
      answer: "Absolutely. DashCache uses advanced AI to automatically blur all faces, license plates, and personal information before any footage leaves your device. We use bank-level encryption and are GDPR compliant. Your personal data is never sold to third parties, and you maintain full control over your content."
    },
    {
      question: "How much can I really earn?",
      answer: "Based on our beta testing with 500+ drivers, the average monthly earnings are $89. Factors that affect earnings include: driving frequency (more hours = more footage), location (urban areas typically pay more), video quality, and unique scenarios captured. Top earners make $150+ monthly by driving during peak hours and in high-demand areas."
    },
    {
      question: "What equipment do I need?",
      answer: "You need a dashcam that records in at least 1080p HD. Most modern dashcams work with DashCache. If you don't have one, early access members receive a free premium 4K dashcam (worth $200) that's optimized for our platform. The dashcam should have WiFi or removable storage for easy upload."
    },
    {
      question: "When will this launch?",
      answer: "DashCache is launching in Q2 2025. Early access members will get access 30 days before the public launch. We're currently in private beta with select drivers and are refining the platform based on their feedback. The countdown timer above shows our target early access launch date."
    },
    {
      question: "Is this legitimate?",
      answer: "Yes, DashCache is a legitimate company backed by leading automotive and AI investors. We're partnered with major autonomous vehicle companies who need real-world driving data to improve their systems. Our team includes former engineers from Tesla, Waymo, and Uber. You can verify our credentials and read about our mission on our About page."
    },
    {
      question: "How do payments work?",
      answer: "Payments are processed monthly via direct deposit or PayPal. You'll receive detailed earnings reports showing which footage was purchased and by whom (anonymized). There's a $25 minimum payout threshold. Early access members get priority payment processing and higher rates for their footage."
    },
    {
      question: "What types of footage are most valuable?",
      answer: "High-value footage includes: complex intersections, highway merging, weather conditions (rain/snow), construction zones, emergency vehicle interactions, and unusual driving scenarios. Urban driving typically generates more valuable data than highway cruising. The AI automatically identifies and tags valuable scenes."
    },
    {
      question: "Can I stop anytime?",
      answer: "Yes, you can pause or stop uploading footage at any time. There are no contracts or commitments. You own your footage and can delete it from our platform whenever you want. Early access benefits are yours to keep even if you take a break from the platform."
    }
  ]

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Get answers to common questions about earning with DashCache
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <h3 className="font-semibold text-white pr-4">
                {faq.question}
              </h3>
              {openItems.has(index) ? (
                <ChevronUp className="h-5 w-5 text-blue-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
            
            {openItems.has(index) && (
              <div className="px-6 pb-4">
                <div className="text-gray-300 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-8 p-6 bg-blue-950/20 border border-blue-500/30 rounded-lg">
        <h3 className="font-semibold text-blue-300 mb-2">Still have questions?</h3>
        <p className="text-gray-400 text-sm mb-4">
          Our team is here to help you understand how DashCache works
        </p>
        <a
          href="mailto:drivers@dashcache.com"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          Email us at drivers@dashcache.com →
        </a>
      </div>
    </div>
  )
}