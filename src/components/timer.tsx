"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Minus, Pause, Play, Plus, Square, Upload } from 'lucide-react'
import { mockJobs, mockTaskTypes, mockUsers } from '@/lib/data'
import { useToast } from "@/hooks/use-toast"

export function Timer() {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [units, setUnits] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused])

  const handleStart = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(true)
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  const handleStop = () => {
    toast({
      title: "Session Saved",
      description: `Your work session of ${formatTime(time)} has been saved.`,
      variant: "default",
    })
    setIsRunning(false)
    setIsPaused(false)
    setTime(0)
    setUnits(0)
  }

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60
    return [hours, minutes, seconds].map(v => v < 10 ? "0" + v : v).join(':')
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Job Tracker</CardTitle>
        <CardDescription>Start the timer to track your work session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-6xl font-mono font-bold text-primary tracking-widest transition-colors duration-300">
            {formatTime(time)}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} size="lg" className="bg-primary hover:bg-primary/90">
              <Play className="mr-2 h-5 w-5" /> Start
            </Button>
          ) : isPaused ? (
            <Button onClick={handleResume} size="lg" variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
              <Play className="mr-2 h-5 w-5" /> Resume
            </Button>
          ) : (
            <Button onClick={handlePause} size="lg" variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700">
              <Pause className="mr-2 h-5 w-5" /> Pause
            </Button>
          )}
          {isRunning && (
            <Button onClick={handleStop} size="lg" variant="destructive">
              <Square className="mr-2 h-5 w-5" /> Stop & Save
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="job">Job</Label>
            <Select>
              <SelectTrigger id="job">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {mockJobs.map(job => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-type">Task Type</Label>
            <Select>
              <SelectTrigger id="task-type">
                <SelectValue placeholder="Select a task type" />
              </SelectTrigger>
              <SelectContent>
                {mockTaskTypes.map(task => <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Units Completed</Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setUnits(u => Math.max(0, u - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input type="number" value={units} onChange={(e) => setUnits(Number(e.target.value))} className="text-center w-20" />
            <Button variant="outline" size="icon" onClick={() => setUnits(u => u + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Add any relevant notes..." />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" /> Upload Photos
        </Button>
      </CardFooter>
    </Card>
  )
}
