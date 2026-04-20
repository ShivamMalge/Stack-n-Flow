"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StackDocs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning</CardTitle>
        <CardDescription>Understanding Stacks</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="mb-2">
          A <strong>Stack</strong> is a linear data structure that follows the Last In First Out (LIFO) principle.
          The last element added is the first one to be removed.
        </p>
        <p className="mb-2">
          <strong>Key Operations:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Push: Add an element to the top - O(1)</li>
          <li>Pop: Remove the top element - O(1)</li>
          <li>Peek: View the top element without removing it - O(1)</li>
        </ul>
        <p className="mt-2">
          Stacks are used in function calls, expression evaluation, and undo mechanisms in applications.
        </p>
      </CardContent>
    </Card>
  )
}
