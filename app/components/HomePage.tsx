"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  Heart, 
  Users, 
  MapPin, 
  Star, 
  Zap, 
  TrendingUp,
  Calendar,
  Dumbbell,
  Camera,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  X,
  MessageSquare,
  UserPlus,
  Check,
  Loader2,
  Info,
  Send
} from "lucide-react"
import { toast } from "sonner"

// Types
interface Partner {
  id: string
  name: string
  avatar: string
  age: number
  fitnessLevel: string
  location: string
  goals: string[]
  bio: string
  rating: number
  isOnline: boolean
  lastSeen: string
  workoutPreferences: string[]
  availability: string[]
  photos?: string[]
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
}

// Mock data for featured connections
const featuredConnections: Partner[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "/placeholder-user.jpg",
    age: 25,
    location: "New York, NY",
    fitnessLevel: "Advanced",
    goals: ["Weight Loss", "Strength"],
    bio: "Looking for a consistent workout partner for morning sessions. Love weightlifting and cardio!",
    rating: 4.8,
    isOnline: true,
    lastSeen: "2 min ago",
    workoutPreferences: ["Weightlifting", "Cardio", "CrossFit"],
    availability: ["Monday", "Wednesday", "Friday", "Saturday"],
    photos: ["/placeholder-user.jpg", "/placeholder-user.jpg", "/placeholder-user.jpg"]
  },
  {
    id: "2",
    name: "Mike Chen",
    avatar: "/placeholder-user.jpg",
    age: 28,
    location: "San Francisco, CA",
    fitnessLevel: "Intermediate",
    goals: ["Muscle Gain", "Endurance"],
    bio: "Marathon runner seeking training partners. Available evenings and weekends.",
    rating: 4.9,
    isOnline: true,
    lastSeen: "5 min ago",
    workoutPreferences: ["Running", "Cycling", "Swimming"],
    availability: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    photos: ["/placeholder-user.jpg", "/placeholder-user.jpg", "/placeholder-user.jpg"]
  },
  {
    id: "3",
    name: "Emma Wilson",
    avatar: "/placeholder-user.jpg",
    age: 22,
    location: "Austin, TX",
    fitnessLevel: "Beginner",
    goals: ["General Fitness", "Weight Loss"],
    bio: "New to fitness and looking for a supportive partner to start this journey together!",
    rating: 4.7,
    isOnline: false,
    lastSeen: "1 hour ago",
    workoutPreferences: ["Yoga", "Walking", "Swimming"],
    availability: ["Monday", "Tuesday", "Thursday", "Sunday"],
    photos: ["/placeholder-user.jpg", "/placeholder-user.jpg", "/placeholder-user.jpg"]
  }
]

const mockChatMessages: { [key: string]: ChatMessage[] } = {
  "1": [
    {
      id: "1",
      senderId: "1",
      senderName: "Sarah Johnson",
      message: "Hey! Ready for our workout session tomorrow?",
      timestamp: "10 min ago"
    },
    {
      id: "2",
      senderId: "user",
      senderName: "You",
      message: "Absolutely! See you at 7 AM at the gym.",
      timestamp: "5 min ago"
    }
  ]
}

const quickStats = [
  {
    title: "Active Connections",
    value: "12",
    icon: Users,
    color: "from-blue-500 to-purple-500",
    change: "+3 this week"
  },
  {
    title: "Workouts Completed",
    value: "24",
    icon: Target,
    color: "from-green-500 to-teal-500",
    change: "+8 this month"
  },
  {
    title: "Calories Burned",
    value: "12,450",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    change: "+2,100 this week"
  },
  {
    title: "Streak Days",
    value: "15",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500",
    change: "Personal best!"
  }
]

const upcomingWorkouts = [
  {
    id: "1",
    title: "Morning Cardio Session",
    time: "7:00 AM",
    date: "Today",
    partner: "Sarah Johnson",
    type: "Cardio",
    duration: "45 min"
  },
  {
    id: "2",
    title: "Strength Training",
    time: "6:00 PM",
    date: "Tomorrow",
    partner: "Mike Chen",
    type: "Strength",
    duration: "60 min"
  },
  {
    id: "3",
    title: "Yoga Flow",
    time: "8:00 AM",
    date: "Friday",
    partner: "Emma Wilson",
    type: "Flexibility",
    duration: "30 min"
  }
]

export default function HomePage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("connections")
  const [partners, setPartners] = useState<Partner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [chatMessages, setChatMessages] = useState<{ [key: string]: ChatMessage[] }>(mockChatMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedChatPartner, setSelectedChatPartner] = useState<Partner | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPartners(featuredConnections)
  }, [])

  const currentPartner = partners[currentIndex]

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragStart({ x: clientX, y: clientY })
    setIsDragging(true)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    })
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    
    const threshold = 100
    const rotation = dragOffset.x * 0.1
    
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        handleLike()
      } else {
        handlePass()
      }
    }
    
    setDragOffset({ x: 0, y: 0 })
    setIsDragging(false)
  }

  const handleLike = async () => {
    if (!currentPartner || sendingRequest) return
    
    setSendingRequest(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove current partner from stack
      setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
      
      toast.success(`Liked ${currentPartner.name}!`, {
        description: "They'll receive a notification and can accept your request.",
        duration: 4000,
      })
      
      // Move to next card
      setCurrentIndex(0)
      
    } catch (error) {
      toast.error("Failed to send like", {
        description: "Please try again.",
        duration: 4000,
      })
    } finally {
      setSendingRequest(false)
    }
  }

  const handlePass = () => {
    if (!currentPartner) return
    
    // Remove current partner from stack
    setPartners(prev => prev.filter(p => p.id !== currentPartner.id))
    setCurrentIndex(0)
    
    toast.success(`Passed on ${currentPartner.name}`, {
      duration: 2000,
    })
  }

  const openProfile = (partner: Partner) => {
    setSelectedPartner(partner)
    setShowProfile(true)
  }

  const openChat = (partner: Partner) => {
    setSelectedChatPartner(partner)
    setIsChatOpen(true)
  }

  const sendMessage = async (partnerId: string) => {
    if (!newMessage.trim() || sendingMessage) return
    
    const partner = partners.find(p => p.id === partnerId) || selectedChatPartner
    if (!partner) return
    
    setSendingMessage(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: "user",
        senderName: "You",
        message: newMessage,
        timestamp: "Just now"
      }
      
      setChatMessages(prev => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] || []), message]
      }))
      setNewMessage("")
      
      toast.success("Message sent!", {
        duration: 2000,
      })

      // Simulate partner response after a delay
      setTimeout(() => {
        const responses = [
          "That sounds great!",
          "I'm looking forward to it!",
          "Let's do this! 💪",
          "Perfect timing!",
          "Count me in!",
          "Awesome, see you there!",
        ]

        const response: ChatMessage = {
          id: (Date.now() + 1).toString(),
          senderId: partner.id,
          senderName: partner.name,
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: "Just now"
        }

        setChatMessages(prev => ({
          ...prev,
          [partnerId]: [...(prev[partnerId] || []), response]
        }))
      }, 2000 + Math.random() * 3000)
      
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again.",
        duration: 4000,
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedChatPartner) {
      sendMessage(selectedChatPartner.id)
    }
  }

  const getRotation = () => {
    return dragOffset.x * 0.1
  }

  const getOpacity = () => {
    return 1 - Math.abs(dragOffset.x) / 300
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to FitSanskriti
          </h1>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Connect with fitness enthusiasts, find your perfect workout partner, and achieve your goals together. 
          Your fitness journey starts with the right connections.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-1">
            <div className="flex space-x-1">
              <Button
                variant={activeTab === "connections" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("connections")}
                className="flex items-center space-x-2"
              >
                <Heart className="h-4 w-4" />
                <span>Featured Connections</span>
              </Button>
              <Button
                variant={activeTab === "upcoming" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("upcoming")}
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Upcoming Workouts</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Connections Tab - Tinder Style */}
        {activeTab === "connections" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Find Your Perfect Workout Partner</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Swipe right to like, left to pass. Find your perfect workout buddy!
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative w-full max-w-sm h-[600px]">
                {partners.length === 0 ? (
                  <Card className="w-full h-full flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                    <CardContent className="text-center">
                      <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No more partners!</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        You've seen all available partners. Check back later for new matches!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Current Card */}
                    {currentPartner && (
                      <Card
                        ref={cardRef}
                        className={`absolute inset-0 w-full h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm cursor-grab active:cursor-grabbing transition-transform duration-200 ${
                          isDragging ? 'scale-105' : ''
                        }`}
                        style={{
                          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`,
                          opacity: getOpacity(),
                          zIndex: 10
                        }}
                        onMouseDown={handleDragStart}
                        onMouseMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                      >
                        <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
                          {/* Photo */}
                          <div className="relative h-2/3 bg-gradient-to-br from-purple-400 to-pink-400">
                            <Avatar className="absolute inset-0 w-full h-full rounded-none">
                              <AvatarImage src={currentPartner.avatar} alt={currentPartner.name} className="object-cover" />
                              <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                                {currentPartner.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Online Status */}
                            {currentPartner.isOnline && (
                              <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                Online
                              </div>
                            )}
                            
                            {/* Age Badge */}
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                              <span className="font-semibold text-lg">{currentPartner.age}</span>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-4 h-1/3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold">{currentPartner.name}</h3>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{currentPartner.rating}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 mb-2">
                                <MapPin className="h-3 w-3" />
                                <span className="text-sm">{currentPartner.location}</span>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {currentPartner.bio}
                              </p>
                              
                              <div className="flex flex-wrap gap-1">
                                {currentPartner.goals.slice(0, 2).map((goal, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {goal}
                                  </Badge>
                                ))}
                                {currentPartner.goals.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{currentPartner.goals.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute bottom-4 right-4 flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openProfile(currentPartner)}
                              className="bg-white/90 backdrop-blur-sm"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Next Card (Preview) */}
                    {partners.length > 1 && (
                      <Card className="absolute inset-0 w-full h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm opacity-50 scale-95">
                        <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
                          <div className="relative h-2/3 bg-gradient-to-br from-purple-400 to-pink-400">
                            <Avatar className="absolute inset-0 w-full h-full rounded-none">
                              <AvatarImage src={partners[1]?.avatar} alt={partners[1]?.name} className="object-cover" />
                              <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                                {partners[1]?.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="p-4 h-1/3">
                            <h3 className="text-xl font-bold">{partners[1]?.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{partners[1]?.age} • {partners[1]?.fitnessLevel}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                {partners.length > 0 && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handlePass}
                      disabled={sendingRequest}
                      className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-red-200 hover:border-red-300 hover:bg-red-50"
                    >
                      <X className="h-6 w-6 text-red-500" />
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleLike}
                      disabled={sendingRequest}
                      className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                    >
                      {sendingRequest ? (
                        <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
                      ) : (
                        <Heart className="h-6 w-6 text-green-500" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Workouts Tab */}
        {activeTab === "upcoming" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your Upcoming Workouts</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Stay on track with your scheduled sessions
              </p>
            </div>

            <div className="space-y-4">
              {upcomingWorkouts.map((workout) => (
                <Card key={workout.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Dumbbell className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{workout.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            with {workout.partner} • {workout.duration}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{workout.date}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{workout.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{workout.type}</Badge>
                        <Button size="sm" variant="outline">
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                Schedule New Workout
                <Calendar className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Jump into your fitness journey with these quick actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="h-auto p-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <div className="flex flex-col items-center space-y-2 text-white">
                <Users className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Find Partners</div>
                  <div className="text-xs opacity-90">Connect with fitness buddies</div>
                </div>
              </div>
            </Button>
            
            <Button
              className="h-auto p-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <div className="flex flex-col items-center space-y-2 text-white">
                <Dumbbell className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Browse Gyms</div>
                  <div className="text-xs opacity-90">Find nearby fitness centers</div>
                </div>
              </div>
            </Button>
            
            <Button
              className="h-auto p-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <div className="flex flex-col items-center space-y-2 text-white">
                <Camera className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Form Analysis</div>
                  <div className="text-xs opacity-90">Check your exercise form</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedChatPartner?.avatar || "/placeholder-user.jpg"} alt={selectedChatPartner?.name} />
                <AvatarFallback>
                  {selectedChatPartner?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span>Chat with {selectedChatPartner?.name}</span>
                {selectedChatPartner?.isOnline && <span className="text-xs text-green-600 font-normal">Online</span>}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg min-h-[300px] max-h-[400px]">
              {selectedChatPartner && chatMessages[selectedChatPartner.id]?.length > 0 ? (
                chatMessages[selectedChatPartner.id].map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.senderId === "user" ? "bg-purple-600 text-white" : "bg-white border border-gray-200"
                      }`}
                    >
                      <p className="break-words">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.senderId === "user" ? "text-purple-200" : "text-gray-500"}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">Start a conversation with {selectedChatPartner?.name}!</p>
                  <p className="text-gray-400 text-xs mt-1">Send a message to break the ice</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2 flex-shrink-0">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendingMessage}
                className="flex-1"
              />
              <Button 
                onClick={() => selectedChatPartner && sendMessage(selectedChatPartner.id)} 
                disabled={!newMessage.trim() || sendingMessage || !selectedChatPartner}
                className="px-3"
              >
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPartner?.name}'s Profile</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedPartner.avatar} alt={selectedPartner.name} />
                  <AvatarFallback>{selectedPartner.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPartner.name}</h3>
                  <p className="text-gray-600">{selectedPartner.age} years • {selectedPartner.fitnessLevel}</p>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedPartner.location}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Bio</h4>
                <p className="text-gray-600">{selectedPartner.bio}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fitness Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.goals.map((goal, index) => (
                    <Badge key={index} variant="secondary">{goal}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Workout Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.workoutPreferences.map((pref, index) => (
                    <Badge key={index} variant="outline">{pref}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Availability</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.availability.map((day, index) => (
                    <Badge key={index} variant="outline">{day}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={() => {
                    setShowProfile(false)
                    handleLike()
                  }}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Like
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowProfile(false)
                    openChat(selectedPartner)
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
