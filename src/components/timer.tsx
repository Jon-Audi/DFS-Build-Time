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
      title: "Quote Saved",
      description: `Your quote has been saved.`,
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
        <CardTitle>Quote Calculator</CardTitle>
        <CardDescription>Create a new quote for a customer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input id="customer-name" placeholder="Enter customer name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" placeholder="e.g., Backyard Privacy Fence" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fence-type">Fence Type</Label>
          <Select>
            <SelectTrigger id="fence-type">
              <SelectValue placeholder="Select a fence type" />
            </SelectTrigger>
            <SelectContent>
              {mockTaskTypes.map(task => <SelectItem key={task.id} value={task.name}>{task.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Linear Feet</Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setUnits(u => Math.max(0, u - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input type="number" value={units} onChange={(e) => setUnits(Number(e.target.value))} className="text-center w-20" placeholder="0" />
            <Button variant="outline" size="icon" onClick={() => setUnits(u => u + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Add any relevant notes for the quote..." />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         <Button variant="outline">
          Calculate Materials
        </Button>
        <Button>
          Save Quote
        </Button>
      </CardFooter>
    </Card>
  )
}
