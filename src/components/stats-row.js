import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Upload, TrendingUp, Clock } from "lucide-react"

export function StatsRow({ earnings, submissions, profile }) {
  const totalEarnings = earnings.reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)
  const thisMonthEarnings = earnings
    .filter(e => new Date(e.earned_at).getMonth() === new Date().getMonth())
    .reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)
  
  const completedSubmissions = submissions.filter(s => s.upload_status === 'completed').length
  const totalSubmissions = submissions.length
  const completionRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0
  
  const stats = [
    {
      title: "Total Earnings",
      value: `$${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      description: "+12% from last month",
      trend: "up"
    },
    {
      title: "This Month",
      value: `$${thisMonthEarnings.toFixed(2)}`,
      icon: TrendingUp,
      description: "Current month earnings",
      trend: "up"
    },
    {
      title: "Videos Uploaded",
      value: totalSubmissions.toString(),
      icon: Upload,
      description: `${completedSubmissions} processed`,
      progress: completionRate
    },
    {
      title: "Hours Contributed",
      value: profile?.total_footage_contributed || "0",
      icon: Clock,
      description: "Total footage hours",
      trend: "neutral"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.progress !== undefined ? (
                  <div className="space-y-1">
                    <Progress value={stat.progress} className="h-2" />
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                ) : (
                  <p className={`text-xs ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {stat.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}