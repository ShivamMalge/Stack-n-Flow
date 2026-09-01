"""Negative and boundary paths.

The existing suite covers the happy path for every structure. These cover the
branches that return early or refuse an operation — the ones most likely to be
broken by a refactor, because nothing else exercises them.
"""

from pratyaksha.data_structures import (
    ArrayList,
    CircularQueue,
    HashTable,
    LinkedList,
    Queue,
    Stack,
)


class TestEmptyStructures:
    def test_pop_on_empty_stack_returns_none_without_emitting(self):
        stack = Stack()

        assert stack.pop() is None
        # The guard must return before _emit, otherwise an empty pop would
        # advance the sequence and desynchronise the replay trace.
        assert stack.event_history() == []
        assert stack.widget.metadata["telemetry"]["event_count"] == 0

    def test_peek_on_empty_stack_returns_none_without_emitting(self):
        stack = Stack()

        assert stack.peek() is None
        assert stack.event_history() == []

    def test_dequeue_on_empty_queue_returns_none_without_emitting(self):
        queue = Queue()

        assert queue.dequeue() is None
        assert queue.event_history() == []

    def test_pop_after_draining_returns_none(self):
        stack = Stack()
        stack.push(1)

        assert stack.pop() == 1
        assert stack.pop() is None
        # Only the push and the successful pop were recorded.
        assert [event.op for event in stack.event_history()] == ["push", "pop"]


class TestOutOfRangeIndices:
    def test_remove_at_out_of_range_returns_none_without_emitting(self):
        linked_list = LinkedList()
        linked_list.insert_front(10)

        assert linked_list.remove_at(5) is None
        assert linked_list.remove_at(-1) is None
        assert [event.op for event in linked_list.event_history()] == ["insert_front"]
        assert len(linked_list.nodes) == 1

    def test_remove_at_accepts_the_last_valid_index(self):
        linked_list = LinkedList()
        linked_list.insert_front(10)
        linked_list.insert_front(20)

        # Boundary: len - 1 must be inside the range the guard allows.
        assert linked_list.remove_at(1) == 10
        assert len(linked_list.nodes) == 1

    def test_array_remove_at_out_of_range_is_ignored(self):
        array = ArrayList()
        array.append(1)

        before = len(array.event_history())
        array.remove_at(99)

        assert len(array.event_history()) == before
        assert len(array.nodes) == 1


class TestCircularQueueCapacity:
    def test_enqueue_beyond_capacity_is_refused(self):
        queue = CircularQueue(max_size=2)
        queue.enqueue("a")
        queue.enqueue("b")

        queue.enqueue("c")

        assert queue.size == 2
        assert [event.op for event in queue.event_history()] == ["enqueue", "enqueue"]

    def test_dequeue_on_empty_circular_queue_is_refused(self):
        queue = CircularQueue(max_size=2)

        queue.dequeue()

        assert queue.size == 0
        assert queue.event_history() == []

    def test_capacity_is_reusable_after_a_dequeue(self):
        queue = CircularQueue(max_size=2)
        queue.enqueue("a")
        queue.enqueue("b")
        queue.dequeue()

        queue.enqueue("c")

        # The wrap-around is the whole point of the structure: a slot freed by a
        # dequeue must become available again.
        assert queue.size == 2


class TestHashTableKeys:
    def test_repeated_integer_key_updates_rather_than_duplicating(self):
        table = HashTable()
        table.insert(5, "first")
        table.insert(5, "second")

        entries = [entry for bucket in table.nodes for entry in bucket]
        assert len(entries) == 1
        assert entries[0]["value"] == "second"

    def test_integer_and_string_forms_of_a_key_are_the_same_key(self):
        table = HashTable()
        table.insert(5, "int")
        table.insert("5", "str")

        entries = [entry for bucket in table.nodes for entry in bucket]
        assert len(entries) == 1


class TestTheme:
    """The widget carries the app's theme tokens, which default to light.

    In a dark notebook that rendered as a white slab, which is what a reader
    actually notices first.
    """

    def test_defaults_to_auto(self):
        from pratyaksha import Stack

        assert Stack().widget.theme == "auto"

    def test_constructor_accepts_a_theme(self):
        from pratyaksha import Queue

        assert Queue(theme="dark").widget.theme == "dark"

    def test_set_theme_switches_it(self):
        from pratyaksha import Stack

        stack = Stack()
        stack.set_theme("light")
        assert stack.widget.theme == "light"

    def test_set_theme_rejects_anything_else(self):
        import pytest

        from pratyaksha import Stack

        with pytest.raises(ValueError, match="auto"):
            Stack().set_theme("purple")

    def test_theme_is_synced_to_the_front_end(self):
        from pratyaksha import Stack

        assert "theme" in Stack().widget.trait_names()
        assert Stack().widget.trait_metadata("theme", "sync") is True


class TestThemeAcrossEveryStructure:
    """A theme that works on Stack and silently ignores AVLTree is worse than none.

    AVLTree called ``BaseTelemetryStructure.__init__`` directly rather than
    through ``super()``, so it accepted ``theme=`` and dropped it. Nothing but a
    sweep over the public API would have caught that.
    """

    @staticmethod
    def _public_classes():
        import inspect

        import pratyaksha

        for name in pratyaksha.__all__:
            obj = getattr(pratyaksha, name)
            if inspect.isclass(obj) and name not in ("VisualizerWidget", "StructureType"):
                yield name, obj

    def test_every_class_accepts_a_theme(self):
        import inspect

        for name, cls in self._public_classes():
            params = inspect.signature(cls.__init__).parameters
            assert "theme" in params, f"{name} has no theme parameter"

    def test_every_class_actually_applies_it(self):
        import inspect

        for name, cls in self._public_classes():
            params = inspect.signature(cls.__init__).parameters
            # Supply anything else the constructor needs positionally.
            required = [
                p for n, p in params.items()
                if n not in ("self", "theme") and p.default is inspect.Parameter.empty
            ]
            args = [[1, 2]] * len(required)
            assert cls(*args, theme="dark").widget.theme == "dark", f"{name} dropped the theme"
