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
import { Play, Download, Eye, Clock } from "lucide-react"

export function VideosTab({ submissions }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`
    }
    return `${mb.toFixed(1)} MB`
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Play className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos uploaded yet</h3>
          <p className="text-gray-500 text-center max-w-sm">
            Start by uploading your first video to see it here. Your videos will be processed and ready for review.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Your Videos</h2>
          <p className="text-sm text-gray-500">
            {submissions.length} video{submissions.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Play className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {submission.original_filename}
                        </p>
                        {submission.processing_metadata && (
                          <p className="text-xs text-gray-500">
                            {submission.processing_metadata.scenarios_detected || 0} scenarios detected
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.upload_status)}>
                      {submission.upload_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(submission.duration_seconds)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatFileSize(submission.file_size)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {submission.upload_status === 'completed' && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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