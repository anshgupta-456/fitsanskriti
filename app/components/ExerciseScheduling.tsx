"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Calendar as CalendarIcon,
  Clock, 
  Users, 
  Dumbbell, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  MapPin,
  User,
  Target
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

// Types
interface Exercise {
  id: string
  name: string
  type: string
  duration: number
  difficulty: string
  description: string
  equipment: string[]
  muscleGroups: string[]
}

interface ScheduledWorkout {
  id: string
  title: string
  date: Date
  time: string
  duration: number
  type: string
  partner?: string
  location: string
  exercises: Exercise[]
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
}

// Mock data
const mockExercises: Exercise[] = [
  {
    id: "1",
    name: "Push-ups",
    type: "Strength",
    duration: 10,
    difficulty: "Beginner",
    description: "Classic bodyweight exercise for chest, shoulders, and triceps",
    equipment: ["None"],
    muscleGroups: ["Chest", "Shoulders", "Triceps"]
  },
  {
    id: "2",
    name: "Squats",
    type: "Strength",
    duration: 15,
    difficulty: "Beginner",
    description: "Fundamental lower body exercise",
    equipment: ["None"],
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"]
  },
  {
    id: "3",
    name: "Running",
    type: "Cardio",
    duration: 30,
    difficulty: "Intermediate",
    description: "Cardiovascular exercise for endurance",
    equipment: ["None"],
    muscleGroups: ["Legs", "Core"]
  },
  {
    id: "4",
    name: "Deadlifts",
    type: "Strength",
    duration: 20,
    difficulty: "Advanced",
    description: "Compound movement for posterior chain",
    equipment: ["Barbell", "Weight Plates"],
    muscleGroups: ["Hamstrings", "Glutes", "Back"]
  }
]

const mockScheduledWorkouts: ScheduledWorkout[] = [
  {
    id: "1",
    title: "Morning Cardio Session",
    date: new Date(),
    time: "07:00",
    duration: 45,
    type: "Cardio",
    partner: "Sarah Johnson",
    location: "Central Park",
    exercises: [mockExercises[2]],
    status: "scheduled",
    notes: "Meet at the main entrance"
  },
  {
    id: "2",
    title: "Strength Training",
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    time: "18:00",
    duration: 60,
    type: "Strength",
    partner: "Mike Chen",
    location: "FitZone Premium",
    exercises: [mockExercises[0], mockExercises[1], mockExercises[3]],
    status: "scheduled",
    notes: "Focus on form and progressive overload"
  }
]

export default function ExerciseScheduling() {
  const { t } = useTranslation()
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<ScheduledWorkout | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    date: new Date(),
    time: "",
    duration: 30,
    type: "",
    partner: "",
    location: "",
    exercises: [] as Exercise[],
    notes: ""
  })

  useEffect(() => {
    setScheduledWorkouts(mockScheduledWorkouts)
  }, [])

  const handleCreateWorkout = () => {
    if (!formData.title || !formData.time || !formData.type) {
      toast.error("Please fill in all required fields")
      return
    }

    const newWorkout: ScheduledWorkout = {
      id: Date.now().toString(),
      title: formData.title,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      type: formData.type,
      partner: formData.partner || undefined,
      location: formData.location,
      exercises: formData.exercises,
      status: "scheduled",
      notes: formData.notes
    }

    setScheduledWorkouts(prev => [...prev, newWorkout])
    setShowCreateDialog(false)
    resetForm()
    
    toast.success("Workout scheduled successfully!", {
      description: `${formData.title} has been added to your schedule.`,
      duration: 4000,
    })
  }

  const handleEditWorkout = (workout: ScheduledWorkout) => {
    setEditingWorkout(workout)
    setFormData({
      title: workout.title,
      date: workout.date,
      time: workout.time,
      duration: workout.duration,
      type: workout.type,
      partner: workout.partner || "",
      location: workout.location,
      exercises: workout.exercises,
      notes: workout.notes || ""
    })
    setShowEditDialog(true)
  }

  const handleUpdateWorkout = () => {
    if (!editingWorkout) return

    const updatedWorkouts = scheduledWorkouts.map(workout =>
      workout.id === editingWorkout.id
        ? {
            ...workout,
            title: formData.title,
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            type: formData.type,
            partner: formData.partner || undefined,
            location: formData.location,
            exercises: formData.exercises,
            notes: formData.notes
          }
        : workout
    )

    setScheduledWorkouts(updatedWorkouts)
    setShowEditDialog(false)
    setEditingWorkout(null)
    resetForm()
    
    toast.success("Workout updated successfully!")
  }

  const handleDeleteWorkout = (workoutId: string) => {
    setScheduledWorkouts(prev => prev.filter(workout => workout.id !== workoutId))
    toast.success("Workout deleted successfully!")
  }

  const handleCompleteWorkout = (workoutId: string) => {
    setScheduledWorkouts(prev =>
      prev.map(workout =>
        workout.id === workoutId
          ? { ...workout, status: "completed" as const }
          : workout
      )
    )
    toast.success("Workout marked as completed! Great job! 🎉")
  }

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date(),
      time: "",
      duration: 30,
      type: "",
      partner: "",
      location: "",
      exercises: [],
      notes: ""
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-3 w-3" />
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "cancelled":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const filteredWorkouts = selectedDate
    ? scheduledWorkouts.filter(workout =>
        workout.date.toDateString() === selectedDate.toDateString()
      )
    : scheduledWorkouts

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Exercise Scheduling
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Plan your workouts, schedule sessions with partners, and track your fitness journey.
        </p>
      </div>

      {/* Calendar and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <span>Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Scheduled</span>
              <span className="font-semibold">5 workouts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">3 workouts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Time</span>
              <span className="font-semibold">4.5 hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Partners</span>
              <span className="font-semibold">2 active</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-purple-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Workout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Schedule New Workout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Workout Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Morning Cardio"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Workout Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cardio">Cardio</SelectItem>
                          <SelectItem value="Strength">Strength</SelectItem>
                          <SelectItem value="Flexibility">Flexibility</SelectItem>
                          <SelectItem value="HIIT">HIIT</SelectItem>
                          <SelectItem value="Yoga">Yoga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.date}
                            onSelect={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="partner">Workout Partner</Label>
                      <Input
                        id="partner"
                        value={formData.partner}
                        onChange={(e) => setFormData(prev => ({ ...prev, partner: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Central Park, FitZone Gym"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes or instructions..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateWorkout}>
                      Schedule Workout
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Find Partners
            </Button>
            <Button variant="outline" className="w-full">
              <Dumbbell className="h-4 w-4 mr-2" />
              Browse Exercises
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Workouts */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>
              {selectedDate ? `Workouts for ${format(selectedDate, "PPP")}` : "All Scheduled Workouts"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No workouts scheduled</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedDate ? "No workouts scheduled for this date." : "Start by scheduling your first workout!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkouts.map((workout) => (
                <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{workout.title}</h3>
                          <Badge className={getStatusColor(workout.status)}>
                            {getStatusIcon(workout.status)}
                            <span className="ml-1 capitalize">{workout.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(workout.date, "MMM dd, yyyy")}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{workout.time} ({workout.duration} min)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Dumbbell className="h-4 w-4" />
                            <span>{workout.type}</span>
                          </div>
                          {workout.partner && (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{workout.partner}</span>
                            </div>
                          )}
                        </div>

                        {workout.location && (
                          <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span>{workout.location}</span>
                          </div>
                        )}

                        {workout.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {workout.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {workout.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditWorkout(workout)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleCompleteWorkout(workout.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

