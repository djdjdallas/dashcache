import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DollarSign, Download, TrendingUp, Calendar } from "lucide-react"
import EarningsChart from "@/components/EarningsChart"

export function EarningsTab({ earnings, profile }) {
  const totalEarnings = earnings.reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)
  const thisMonthEarnings = earnings
    .filter(e => new Date(e.earned_at).getMonth() === new Date().getMonth())
    .reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)
  const lastMonthEarnings = earnings
    .filter(e => new Date(e.earned_at).getMonth() === new Date().getMonth() - 1)
    .reduce((sum, earning) => sum + parseFloat(earning.amount || 0), 0)
  
  const monthlyGrowth = lastMonthEarnings > 0 
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
    : 0

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatEarningType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (earnings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <DollarSign className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings yet</h3>
          <p className="text-gray-500 text-center max-w-sm">
            Upload videos to start earning! You'll see your earnings and payout history here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-500">All time earnings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">${thisMonthEarnings.toFixed(2)}</p>
              <p className={`text-xs ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Next Payout</h3>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                ${earnings.filter(e => e.payment_status === 'pending')
                  .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Pending payment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <EarningsChart earnings={earnings} />
        </CardContent>
      </Card>

      {/* Earnings History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Earnings History</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.map((earning) => (
                <TableRow key={earning.id}>
                  <TableCell className="text-sm">
                    {new Date(earning.earned_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {formatEarningType(earning.earning_type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-green-600">
                      +${parseFloat(earning.amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(earning.payment_status)}>
                      {earning.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {earning.description || 'Video upload reward'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}