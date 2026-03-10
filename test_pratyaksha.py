from pratyaksha import Stack, Queue, LinkedList

def test_imports():
    try:
        s = Stack()
        s.push(10)
        s.push(20)
        print("Stack: push(10), push(20) - OK")
        
        val = s.pop()
        print(f"Stack: pop() -> {val} - OK")
        
        q = Queue()
        q.enqueue(1)
        print("Queue: enqueue(1) - OK")
        
        ll = LinkedList()
        ll.insert_front(5)
        print("LinkedList: insert_front(5) - OK")
        
        print("\nSUCCESS: Pratyaksha package is working correctly!")
    except Exception as e:
        print(f"\nFAILURE: {str(e)}")
        exit(1)

if __name__ == "__main__":
    test_imports()
