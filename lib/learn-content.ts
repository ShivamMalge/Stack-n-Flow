import {
    ArrowLeftRight,
    Binary,
    CircleDashed,
    Coins,
    GitBranchPlus,
    GitFork,
    GitMerge,
    GitPullRequest,
    LayoutGrid,
    ListTree,
    Network,
    Search,
    SortAsc,
    SplitSquareVertical,
    SquareStack,
    Table2,
    Workflow,
    LucideIcon
} from "lucide-react"

export type Language = "python" | "java" | "cpp" | "javascript"

export interface CodeImplementation {
    code: string
    explanations: { line: number; text: string }[]
}

export interface LearnContent {
    name: string
    icon: LucideIcon
    description: string
    content: {
        intuition: string
        algorithmSteps: string[]
        implementations: Partial<Record<Language, CodeImplementation>>
        types: string[]
        operations: { name: string; complexity: string; description: string }[]
        applications: string[]
        advantages: string[]
        disadvantages: string[]
    }
}

export const dataStructureInfo: Record<string, LearnContent> = {
    "linked-list": {
        name: "Linked List",
        icon: GitPullRequest,
        description: "A linear collection of data elements whose order is not given by their physical placement in memory.",
        content: {
            intuition:
                "Think of a linked list as a chain, where each link points to the next one. Unlike arrays, linked lists don't require contiguous memory allocation, making insertions and deletions more efficient.",
            algorithmSteps: [
                "Create a Node class containing a 'data' field and a 'next' pointer.",
                "Initialize the LinkedList with a 'head' pointer set to null.",
                "To insert at the end: traverse the list starting from the head until you find a node whose 'next' is null.",
                "Set the 'next' of the last node to the new node.",
                "To search: start at the head and follow 'next' pointers until the data matches the target or 'next' is null.",
            ],
            implementations: {
                python: {
                    code: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        last = self.head
        while last.next:
            last = last.next
        last.next = new_node`,
                    explanations: [
                        { line: 1, text: "Define the individual node structure." },
                        { line: 2, text: "Constructor to initialize node with data." },
                        { line: 4, text: "Every new node points to None by default." },
                        { line: 6, text: "Define the Linked List structure managing the nodes." },
                        { line: 8, text: "The list initially starts empty with no head." },
                        { line: 10, text: "Function to add a new element at the end." },
                        { line: 12, text: "If the list is empty..." },
                        { line: 13, text: "...make the new node the head." },
                        { line: 15, text: "Otherwise, start at the head node." },
                        { line: 16, text: "Traverse until the last node is reached." },
                        { line: 18, text: "Link the final node to our newly created node." }
                    ]
                },
                javascript: {
                    code: `class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }
  
  append(data) {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }
}`,
                    explanations: [
                        { line: 1, text: "Declare the Node class to hold data and the pointer." },
                        { line: 4, text: "Next pointer starts off null until linked." },
                        { line: 8, text: "Declare the LinkedList class." },
                        { line: 13, text: "Method to append an item to the end of the list." },
                        { line: 15, text: "If there is no head node, the list is empty." },
                        { line: 19, text: "Traverse the sequence by moving current to current.next." },
                        { line: 23, text: "Set the last node's next pointer to the new node." }
                    ]
                }
            },
            types: ["Singly Linked List", "Doubly Linked List", "Circular Linked List"],
            operations: [
                { name: "Access", complexity: "O(n)", description: "To access an element, you must traverse from the head." },
                { name: "Search", complexity: "O(n)", description: "Linear search through the list." },
                { name: "Insertion", complexity: "O(1)", description: "If position is known, otherwise O(n) to find position." },
                { name: "Deletion", complexity: "O(1)", description: "If position is known, otherwise O(n) to find position." },
            ],
            applications: [
                "Implementation of stacks and queues",
                "Dynamic memory allocation",
                "Maintaining directory of names",
                "Performing arithmetic operations on long integers",
                "Representing sparse matrices",
            ],
            advantages: [
                "Dynamic size",
                "Ease of insertion/deletion",
                "No memory wastage",
                "Implementation of other data structures",
            ],
            disadvantages: [
                "Random access is not allowed",
                "Extra memory for pointers",
                "Not cache friendly",
                "Reverse traversal is difficult in singly linked lists",
            ],
        },
    },
    "stack": {
        name: "Stack",
        icon: SquareStack,
        description: "A linear data structure that follows the Last In First Out (LIFO) principle.",
        content: {
            intuition:
                "Think of a stack like a pile of plates. You can only add or remove plates from the top. The last plate placed is the first one to be removed.",
            algorithmSteps: [
                "Initialize an empty array to track the stack elements.",
                "Push: Append a new element to the end of the array (conceptually the 'top').",
                "Pop: Check if the stack is empty. If not, remove and return the last element of the array.",
                "Peek: Return the last element of the array without modifying the state."
            ],
            implementations: {
                python: {
                    code: `class Stack:
    def __init__(self):
        self.items = []

    def is_empty(self):
        return len(self.items) == 0

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if not self.is_empty():
            return self.items.pop()
        raise IndexError("pop from empty stack")

    def peek(self):
        if not self.is_empty():
            return self.items[-1]
        return None`,
                    explanations: [
                        { line: 1, text: "Define the Stack class." },
                        { line: 3, text: "Use a simple dynamic array underneath." },
                        { line: 6, text: "Helper to safely check if the stack contains items." },
                        { line: 9, text: "Pushing simply appends to the array (O(1))." },
                        { line: 12, text: "Popping requires ensuring the stack has items." },
                        { line: 13, text: "Remove from the array's end." },
                        { line: 14, text: "Throw an error if the stack was already empty." },
                        { line: 18, text: "Peek returns the top item without mutating the list." }
                    ]
                },
                javascript: {
                    code: `class Stack {
  constructor() {
    this.items = [];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  push(item) {
    this.items.push(item);
  }

  pop() {
    if (this.isEmpty()) return null;
    return this.items.pop();
  }

  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.items.length - 1];
  }
}`,
                    explanations: [
                        { line: 3, text: "Initialize an internal array to hold items." },
                        { line: 7, text: "Check if the length of the internal array is 0." },
                        { line: 11, text: "Push onto the back of the Javascript array." },
                        { line: 15, text: "Ensure we don't pop an empty array safely." },
                        { line: 16, text: "Remove the top item." },
                        { line: 21, text: "Read the last item in the array without removal." }
                    ]
                }
            },
            types: ["Array-based Stack", "Linked List-based Stack"],
            operations: [
                { name: "Push", complexity: "O(1)", description: "Add an element to the top of the stack." },
                { name: "Pop", complexity: "O(1)", description: "Remove the top element from the stack." },
                { name: "Peek/Top", complexity: "O(1)", description: "View the top element without removing it." },
                { name: "isEmpty", complexity: "O(1)", description: "Check if the stack is empty." },
            ],
            applications: [
                "Function call management (call stack)",
                "Expression evaluation and conversion",
                "Backtracking algorithms",
                "Undo mechanisms in text editors",
                "Browser history (back button)",
            ],
            advantages: [
                "Simple implementation",
                "Efficient for LIFO operations",
                "Memory efficient (no gaps)",
                "Useful for parsing and expression evaluation",
            ],
            disadvantages: [
                "Limited capacity in array implementation",
                "No random access to elements",
                "No easy way to search for an element",
                "Stack overflow/underflow issues",
            ],
        },
    },
    "array": {
        name: "Array",
        icon: LayoutGrid,
        description: "A collection of elements stored at contiguous memory locations, accessible by an index.",
        content: {
            intuition:
                "Think of an array like a row of mailboxes, each with a unique number. You can directly access any mailbox if you know its number, without checking the others first.",
            algorithmSteps: [
                "Declare a block of contiguous memory, determining the maximum size upfront (for static arrays).",
                "To perform a lookup, calculate the memory offset using: base_address + (index * element_size).",
                "To insert an element at a specific index, shift all subsequent elements forward one spot.",
                "To delete an element, shift all subsequent elements backward one spot to fill the gap."
            ],
            implementations: {
                python: {
                    code: `def insert_element(arr, num, pos):
    # If the array was fixed size, we would shift elements here
    # Since Python lists are dynamic, insert is O(n) anyway.
    arr.insert(pos, num)
    return arr

def delete_element(arr, pos):
    if pos < 0 or pos >= len(arr):
        return None
    # Elements to the right are shifted left by Python internally.
    return arr.pop(pos)

my_array = [10, 20, 30, 40]
print(my_array[2])  # O(1) Access -> 30`,
                    explanations: [
                        { line: 1, text: "Python abstracts memory management, treating arrays effectively as dynamic lists." },
                        { line: 4, text: "insert() shunts subsequent elements right." },
                        { line: 11, text: "pop(index) removes the element and auto-shifts subsequent items leftwards." },
                        { line: 14, text: "Direct memory access via index bracket notation gives O(1) access." }
                    ]
                },
                java: {
                    code: `public class ArrayDemo {
    public static void main(String[] args) {
        // Declaration and instantiation
        int[] arr = new int[5];
        
        // Initialization (O(1))
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        
        // Access via index offset (O(1))
        System.out.println("Element at index 2: " + arr[2]);
        
        // Simulating deletion shifting (O(n))
        int positionToDelete = 1;
        for (int i = positionToDelete; i < arr.length - 1; i++) {
            arr[i] = arr[i + 1];
        }
        arr[arr.length - 1] = 0; // Clear last
    }
}`,
                    explanations: [
                        { line: 4, text: "Memory is allocated continuously for 5 integer blocks." },
                        { line: 7, text: "Writing directly to calculated offsets in memory is O(1)." },
                        { line: 12, text: "Reading is direct and instantaneous." },
                        { line: 16, text: "Deleting an element manually requires O(n) looping." },
                        { line: 17, text: "We shift each element to the left to overwrite the target." },
                        { line: 19, text: "Optionally zero out or mark the tail element." }
                    ]
                }
            },
            types: ["Static Arrays", "Dynamic Arrays", "Multi-dimensional Arrays"],
            operations: [
                { name: "Access", complexity: "O(1)", description: "Direct access by index." },
                { name: "Search", complexity: "O(n)", description: "Linear search for unsorted arrays." },
                { name: "Insertion", complexity: "O(n)", description: "Need to shift elements in worst case." },
                { name: "Deletion", complexity: "O(n)", description: "Need to shift elements in worst case." },
            ],
            applications: [
                "Storing and accessing sequential data",
                "Temporary storage in algorithms",
                "Lookup tables and buffers",
                "Base for other data structures (stacks, queues)",
                "Matrix operations in scientific computing",
            ],
            advantages: [
                "Simple implementation",
                "Random access in O(1) time",
                "Good locality of reference",
                "Memory efficient (no pointers needed)",
            ],
            disadvantages: [
                "Fixed size for static arrays",
                "Expensive insertions and deletions",
                "Memory wastage in static arrays",
                "Contiguous memory requirement",
            ],
        },
    },
    "binary-search": {
        name: "Binary Search",
        icon: Search,
        description: "An efficient algorithm for finding an item from a sorted list of items.",
        content: {
            intuition:
                "Imagine looking up a word in a dictionary. You don't read page by page. Instead, you open the book to the middle. If the target word is alphabetically before the middle word, you know it's in the first half. You repeat this halving process until you find the word. This is exactly how binary search works.",
            algorithmSteps: [
                "Requires a sorted array. Initialize two pointers: 'low' at 0 and 'high' at array.length - 1.",
                "While 'low' is less than or equal to 'high', calculate 'mid' as (low + high) / 2.",
                "Check the element at 'mid'. If it matches the target, return 'mid'.",
                "If the target is smaller, the element must be in the left half. Set 'high' to mid - 1.",
                "If the target is larger, the element must be in the right half. Set 'low' to mid + 1.",
                "If the loop ends and nothing was found, return -1 indicating failure."
            ],
            implementations: {
                python: {
                    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1  # Ignore left half
        else:
            high = mid - 1 # Ignore right half
            
    return -1`,
                    explanations: [
                        { line: 2, text: "Set the bounds to span the entire array." },
                        { line: 5, text: "Iterate as long as the search space is valid." },
                        { line: 6, text: "Calculate the middle index without float division." },
                        { line: 8, text: "Target found, return instantly." },
                        { line: 10, text: "If the target is larger than mid, it must be to the right." },
                        { line: 11, text: "Update low boundary." },
                        { line: 13, text: "If the target is smaller, it's to the left." }
                    ]
                },
                java: {
                    code: `public class BinarySearch {
    public static int search(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        
        while (left <= right) {
            // Prevent potential integer overflow mapping mid
            int mid = left + (right - left) / 2;
            
            if (arr[mid] == target) {
                return mid;
            }
            if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
}`,
                    explanations: [
                        { line: 3, text: "Initialize left and right bounds." },
                        { line: 8, text: "Calculate mid. 'left + (right - left)/2' prevents overflow on huge arrays." },
                        { line: 10, text: "Check match." },
                        { line: 14, text: "Eliminate left half by shifting left boundary." },
                        { line: 16, text: "Eliminate right half by shifting right boundary." }
                    ]
                }
            },
            types: ["Iterative Binary Search", "Recursive Binary Search"],
            operations: [
                {
                    name: "Best Case",
                    complexity: "O(1)",
                    description: "Target is found immediately at the middle."
                },
                {
                    name: "Average Case",
                    complexity: "O(log n)",
                    description: "Continually halves the search depth."
                },
                {
                    name: "Worst Case",
                    complexity: "O(log n)",
                    description: "Element not found or at far ends of the space."
                },
                {
                    name: "Space Complexity",
                    complexity: "O(1)",
                    description: "Iterative runs using constant space. Recursive uses O(log n) call stack."
                }
            ],
            applications: [
                "Finding an element in a sorted collection.",
                "Used as a subroutine in many complex algorithms.",
                "Database querying systems.",
                "Locating versions and commits in systems like git bisect."
            ],
            advantages: [
                "Extremely efficient for large sorted datasets.",
                "Does not mutate the dataset.",
                "Very low memory footprint"
            ],
            disadvantages: [
                "Requires the array to be strictly sorted first.",
                "Only operates predictably on contiguous memory structures like Arrays (not efficiently on Linked Lists)."
            ]
        }
    }
    // Let's add fallbacks for the rest since we are stubbing them for now.
}

const unpopulatedDataStructures = [
    { slug: "doubly-linked-list", name: "Doubly Linked List", icon: ArrowLeftRight },
    { slug: "queue", name: "Queue", icon: Workflow },
    { slug: "circular-queue", name: "Circular Queue", icon: CircleDashed },
    { slug: "tree", name: "Tree", icon: ListTree },
    { slug: "avl-tree", name: "AVL Tree", icon: GitBranchPlus },
    { slug: "graph", name: "Graph", icon: GitMerge },
    { slug: "hash-table", name: "Hash Table", icon: Table2 },
    { slug: "heap", name: "Heap", icon: ListTree },
    { slug: "searching-algorithms", name: "Searching Algorithms", icon: Search },
    { slug: "sorting-algorithms", name: "Sorting Algorithms", icon: SortAsc },
    { slug: "greedy-algorithms", name: "Greedy Algorithms", icon: Coins },
    { slug: "divide-conquer", name: "Divide & Conquer", icon: SplitSquareVertical },
    { slug: "dynamic-programming", name: "Dynamic Programming", icon: Table2 },
    { slug: "pathfinding", name: "Pathfinding Algorithms", icon: Network },
]

for (const ds of unpopulatedDataStructures) {
    if (!dataStructureInfo[ds.slug]) {
        dataStructureInfo[ds.slug] = {
            name: ds.name,
            icon: ds.icon,
            description: "Detailed description coming soon.",
            content: {
                intuition: "Intuition explanation is being written and will be added soon.",
                algorithmSteps: [],
                implementations: {},
                types: [],
                operations: [],
                applications: [],
                advantages: [],
                disadvantages: []
            }
        }
    }
}
