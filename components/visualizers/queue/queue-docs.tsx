"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function QueueDocs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning</CardTitle>
        <CardDescription>Understanding Queues</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="mb-2">
          A <strong>Queue</strong> is a linear data structure that follows the First In First Out (FIFO) principle.
          The first element added is the first one to be removed.
        </p>
        <p className="mb-2">
          <strong>Key Operations:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Enqueue: Add an element to the rear - O(1)</li>
          <li>Dequeue: Remove the front element - O(1)</li>
          <li>Peek: View the front element without removing it - O(1)</li>
        </ul>
        <p className="mt-2">
          Queues are used in scheduling, breadth-first search, and handling requests in web servers.
        </p>
      </CardContent>
    </Card>
  )
}
