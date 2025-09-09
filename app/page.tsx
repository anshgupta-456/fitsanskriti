"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Activity,
  Target,
  Users,
  Calendar,
  TrendingUp,
  Zap,
  Play,
  CheckCircle,
  Trophy,
  Heart,
  Dumbbell,
  Camera,
  Menu,
  X,
} from "lucide-react"

// Import components
import LanguageSelector from "./components/LanguageSelector"
import GymMachineGuide from "./components/GymMachineGuide"
import WorkoutPlanner from "./components/WorkoutPlanner"
import FitnessTracker from "./components/FitnessTracker"
import TinderStylePartnerFinder from "./components/TinderStylePartnerFinder"
import HomePage from "./components/HomePage"
import GymListing from "./components/GymListing"
import ExerciseScheduling from "./components/ExerciseScheduling"
import DailyExercises from "./components/DailyExercises"
import UserProfile from "./components/UserProfile"

export default function FitnessApp() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("home")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Mock data for dashboard
  const todayStats = {
    workoutsCompleted: 1,
    workoutGoal: 3,
    caloriesBurned: 320,
    calorieGoal: 500,
    activeMinutes: 45,
    activeGoal: 60,
    steps: 8247,
    stepGoal: 10000,
  }

  const quickActions = [
    {
      id: "daily-workout",
      title: t("start_daily_workout"),
      description: t("morning_energy_boost"),
      icon: Play,
      color: "from-green-500 to-teal-500",
      action: () => setActiveTab("daily-exercises"),
    },
    {
      id: "check-form",
      title: t("check_my_form"),
      description: t("ai_posture_analysis"),
      icon: Camera,
      color: "from-blue-500 to-purple-500",
      action: () => setActiveTab("machines"),
    },
    {
      id: "find-partner",
      title: t("find_partner"),
      description: t("connect_workout_buddies"),
      icon: Users,
      color: "from-purple-500 to-pink-500",
      action: () => setActiveTab("partners"),
    },
    {
      id: "track-progress",
      title: t("track_progress"),
      description: t("view_fitness_journey"),
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
      action: () => setActiveTab("tracker"),
    },
  ]

  const recentWorkouts = [
    { name: t("upper_body_strength"), date: t("today"), duration: 45, calories: 320, completed: true },
    { name: t("morning_cardio"), date: t("yesterday"), duration: 30, calories: 280, completed: true },
    { name: t("yoga_flow"), date: "2 " + t("days_ago"), duration: 60, calories: 180, completed: true },
  ]

  const upcomingWorkouts = [
    { name: t("lower_body_strength"), time: "6:00 PM", type: t("strength"), duration: 45 },
    { name: t("hiit_cardio"), time: t("tomorrow") + " 7:00 AM", type: t("cardio"), duration: 25 },
    { name: t("flexibility_stretch"), time: t("tomorrow") + " 8:00 PM", type: t("flexibility"), duration: 30 },
  ]

  const achievements = [
    { name: t("week_warrior"), description: t("week_warrior_desc"), icon: "💪", earned: true },
    { name: t("consistency_king"), description: t("consistency_king_desc"), icon: "👑", earned: false },
    { name: t("calorie_crusher"), description: t("calorie_crusher_desc"), icon: "🔥", earned: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    FitSanskriti
                  </h1>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex-1 p-4">
                <nav className="space-y-2">
                  {[
                    { id: "home", label: "Home", icon: Heart },
                    { id: "gym-listing", label: "Gym Listing", icon: Dumbbell },
                    { id: "exercise-scheduling", label: "Schedule", icon: Calendar },
                    { id: "form-analysis", label: "Form Analysis", icon: Camera },
                    { id: "partners", label: "Connect", icon: Users },
                    { id: "tracker", label: "Progress", icon: TrendingUp },
                    { id: "profile", label: "Profile", icon: Users },
                  ].map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab(item.id)
                        setSidebarOpen(false)
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t">
                <LanguageSelector />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed left-0 top-0 h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    FitSanskriti
                  </h1>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1"
              >
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {[
                { id: "home", label: "Home", icon: Heart },
                { id: "gym-listing", label: "Gym Listing", icon: Dumbbell },
                { id: "exercise-scheduling", label: "Schedule", icon: Calendar },
                { id: "form-analysis", label: "Form Analysis", icon: Camera },
                { id: "partners", label: "Connect", icon: Users },
                { id: "tracker", label: "Progress", icon: TrendingUp },
                { id: "profile", label: "Profile", icon: Users },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && item.label}
                </Button>
              ))}
            </nav>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t">
            {!sidebarCollapsed && <LanguageSelector />}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`px-4 py-8 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="space-y-8">

          {/* Home Page */}
          {activeTab === "home" && <HomePage />}

          {/* Other Tabs */}
          {activeTab === "gym-listing" && <GymListing />}
          {activeTab === "exercise-scheduling" && <ExerciseScheduling />}
          {activeTab === "form-analysis" && <GymMachineGuide />}
          {activeTab === "partners" && <TinderStylePartnerFinder />}
          {activeTab === "tracker" && <FitnessTracker />}
          {activeTab === "profile" && <UserProfile />}
        </div>
      </main>

      {/* Footer */}
      <footer className={`bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-16 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold">FitSanskriti</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t("footer_text", "Your AI-powered fitness companion for a healthier lifestyle.")}
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">
                {t("privacy", "Privacy")}
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                {t("terms", "Terms")}
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                {t("support", "Support")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
