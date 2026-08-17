"""Import smoke check for the pratyaksha package.

This is NOT a test suite and NOT a verification gate. It only confirms that the
package imports and that a few methods run without raising. It does not check
return values, and it does not exercise the widget or the notebook render path —
a passing run here says nothing about whether visualizations actually display.

The real tests live in tests/python/ and are run with pytest.
"""

import sys

from pratyaksha import Stack, Queue, LinkedList


def main() -> int:
    try:
        s = Stack()
        s.push(10)
        s.push(20)
        print(f"Stack: push(10), push(20) -> {s.nodes}")
        print(f"Stack: pop() -> {s.pop()}")

        q = Queue()
        q.enqueue(1)
        print(f"Queue: enqueue(1) -> {q.nodes}")

        ll = LinkedList()
        ll.insert_front(5)
        print(f"LinkedList: insert_front(5) -> {ll.nodes}")
    except Exception as exc:
        print(f"\nFAILED: {exc}", file=sys.stderr)
        return 1

    print("\nImports and basic operations OK. Run `pytest tests/python` for real coverage.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
