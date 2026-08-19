import { describe, it, expect } from "vitest"
import {
    buildDelete,
    buildInsert,
    buildSearch,
    entryCount,
    hashOf,
    loadFactor,
    makeTable,
    probeSlot,
    secondaryHash,
    type HashOptions,
    type HashSlot,
    type Strategy,
    MAX_TABLE_SIZE,
    MIN_TABLE_SIZE,
} from "@/lib/hashing"

const opts = (strategy: Strategy): HashOptions => ({ strategy, multiplier: 31 })

/** Insert a run of keys and return the table. */
function insertAll(slots: HashSlot[], keys: string[], strategy: Strategy): HashSlot[] {
    let state = slots
    for (const key of keys) {
        const result = buildInsert(state, key, key, opts(strategy))
        if (!result.error) state = result.slots
    }
    return state
}

/** Every key currently stored, in slot order. */
function keysOf(slots: readonly HashSlot[]): string[] {
    return slots.flatMap((slot) => slot.entries.map((e) => e.key))
}

describe("hashOf", () => {
    // The division method is what every textbook opens with, and what a
    // student expects to see for a numeric key.
    it("uses k mod m for a numeric key", () => {
        expect(hashOf("42", 10).index).toBe(2)
        expect(hashOf("42", 10).working).toContain("42 mod 10 = 2")
        expect(hashOf("7", 10).index).toBe(7)
    })

    it("uses a polynomial hash for a non-numeric key", () => {
        const info = hashOf("alice", 10)
        expect(info.index).toBeGreaterThanOrEqual(0)
        expect(info.index).toBeLessThan(10)
        expect(info.working).toContain("polynomial")
    })

    it("always lands inside the table", () => {
        for (const size of [5, 7, 11, 19]) {
            for (const key of ["0", "9999", "a", "zebra", "Key_1"]) {
                const { index } = hashOf(key, size)
                expect(index).toBeGreaterThanOrEqual(0)
                expect(index).toBeLessThan(size)
            }
        }
    })

    it("is deterministic", () => {
        expect(hashOf("alice", 10).index).toBe(hashOf("alice", 10).index)
    })
})

describe("secondaryHash", () => {
    // A zero step would probe the same slot forever.
    it("is never zero", () => {
        for (const key of ["0", "10", "20", "alice", "bob"]) {
            for (const size of [5, 7, 11]) {
                expect(secondaryHash(key, size)).toBeGreaterThan(0)
            }
        }
    })

    it("stays below the table size", () => {
        for (const key of ["123", "xyz"]) {
            expect(secondaryHash(key, 11)).toBeLessThan(11)
        }
    })
})

describe("probeSlot", () => {
    it("steps by one for linear probing", () => {
        expect([0, 1, 2, 3].map((i) => probeSlot(8, i, 10, "linear", "8"))).toEqual([8, 9, 0, 1])
    })

    it("steps by i squared for quadratic probing", () => {
        expect([0, 1, 2, 3].map((i) => probeSlot(0, i, 10, "quadratic", "0"))).toEqual([0, 1, 4, 9])
    })

    it("steps by the secondary hash for double hashing", () => {
        const step = secondaryHash("12", 11)
        expect(probeSlot(3, 2, 11, "double", "12")).toBe((3 + 2 * step) % 11)
    })

    it("never moves for chaining", () => {
        expect([0, 1, 5].map((i) => probeSlot(4, i, 10, "chaining", "4"))).toEqual([4, 4, 4])
    })

    it("stays inside the table", () => {
        for (const strategy of ["linear", "quadratic", "double"] as Strategy[]) {
            for (let i = 0; i < 20; i++) {
                const slot = probeSlot(9, i, 11, strategy, "99")
                expect(slot).toBeGreaterThanOrEqual(0)
                expect(slot).toBeLessThan(11)
            }
        }
    })
})

describe("makeTable", () => {
    it("clamps to the supported range", () => {
        expect(makeTable(1)).toHaveLength(MIN_TABLE_SIZE)
        expect(makeTable(999)).toHaveLength(MAX_TABLE_SIZE)
    })

    it("starts empty with no tombstones", () => {
        const table = makeTable(10)
        expect(entryCount(table)).toBe(0)
        expect(loadFactor(table)).toBe(0)
        expect(table.every((s) => !s.tombstone)).toBe(true)
    })
})

describe("chaining", () => {
    it("puts colliding keys in the same bucket", () => {
        // 2, 12 and 22 all hash to 2 under k mod 10.
        const table = insertAll(makeTable(10), ["2", "12", "22"], "chaining")
        expect(table[2].entries.map((e) => e.key)).toEqual(["2", "12", "22"])
    })

    it("has no size limit beyond memory", () => {
        const table = insertAll(makeTable(5), ["0", "5", "10", "15", "20", "25"], "chaining")
        expect(entryCount(table)).toBe(6)
        expect(loadFactor(table)).toBeGreaterThan(1)
    })

    it("updates in place rather than duplicating", () => {
        let table = insertAll(makeTable(10), ["7"], "chaining")
        table = buildInsert(table, "7", "second", opts("chaining")).slots
        expect(entryCount(table)).toBe(1)
        expect(table[7].entries[0].value).toBe("second")
    })

    it("needs no tombstone on delete", () => {
        let table = insertAll(makeTable(10), ["2", "12"], "chaining")
        table = buildDelete(table, "2", opts("chaining")).slots
        expect(table[2].entries.map((e) => e.key)).toEqual(["12"])
        expect(table[2].tombstone).toBe(false)
    })
})

describe("open addressing", () => {
    const OPEN: Strategy[] = ["linear", "quadratic", "double"]

    it.each(OPEN)("stores at most one entry per slot (%s)", (strategy) => {
        const table = insertAll(makeTable(11), ["2", "13", "24", "35"], strategy)
        expect(table.every((slot) => slot.entries.length <= 1)).toBe(true)
    })

    it.each(OPEN)("finds every key it stored (%s)", (strategy) => {
        const keys = ["2", "13", "24", "5", "16"]
        const table = insertAll(makeTable(11), keys, strategy)
        for (const key of keys) {
            expect(buildSearch(table, key, opts(strategy)).result, `${strategy} lost ${key}`)
                .toBe(`${key} = ${key}`)
        }
    })

    it.each(OPEN)("reports a missing key rather than looping (%s)", (strategy) => {
        const table = insertAll(makeTable(11), ["2", "13"], strategy)
        expect(buildSearch(table, "999", opts(strategy)).result).toMatch(/not in the table/)
    })

    it("resolves a linear collision to the next slot", () => {
        const table = insertAll(makeTable(10), ["2", "12"], "linear")
        expect(table[2].entries[0].key).toBe("2")
        expect(table[3].entries[0].key).toBe("12")
    })

    it("resolves a quadratic collision by i squared", () => {
        // Home 2 is taken, so probe 1 goes to 2 + 1 = 3.
        const table = insertAll(makeTable(10), ["2", "12"], "quadratic")
        expect(table[3].entries[0].key).toBe("12")
    })

    it("updates in place on a repeated key", () => {
        let table = insertAll(makeTable(11), ["4"], "linear")
        table = buildInsert(table, "4", "again", opts("linear")).slots
        expect(entryCount(table)).toBe(1)
    })

    it("refuses to insert into a full table", () => {
        const table = insertAll(makeTable(5), ["0", "1", "2", "3", "4"], "linear")
        expect(entryCount(table)).toBe(5)
        expect(buildInsert(table, "9", "9", opts("linear")).error).toMatch(/table is full/)
    })

    // Quadratic probing does not necessarily visit every slot, so it can fail
    // to place a key while the table still has room. That is the classic
    // exam point, and the message has to say so rather than "table full".
    it("explains a quadratic probe sequence that cannot reach a free slot", () => {
        // Every key hashes to 0, so probes land on 0,1,4,9,6,5,6,9,4,1 (mod 10)
        // — slots 2, 3, 7 and 8 are never reached.
        const table = insertAll(makeTable(10), ["0", "10", "20", "30", "40", "50"], "quadratic")
        const unreachable = buildInsert(table, "60", "60", opts("quadratic"))
        expect(entryCount(table)).toBeLessThan(10)
        expect(unreachable.error).toMatch(/does not reach every slot/)
    })
})

describe("deletion under open addressing", () => {
    // Clearing a slot outright breaks every probe chain through it, which is
    // why the tombstone exists at all.
    it("leaves a tombstone", () => {
        let table = insertAll(makeTable(10), ["2", "12"], "linear")
        table = buildDelete(table, "2", opts("linear")).slots
        expect(table[2].entries).toHaveLength(0)
        expect(table[2].tombstone).toBe(true)
    })

    it("keeps a key reachable past the tombstone", () => {
        let table = insertAll(makeTable(10), ["2", "12"], "linear")
        table = buildDelete(table, "2", opts("linear")).slots
        // 12 sits at slot 3, its probe chain starting at the deleted slot 2.
        expect(buildSearch(table, "12", opts("linear")).result).toBe("12 = 12")
    })

    it("reuses a tombstoned slot on the next insert", () => {
        let table = insertAll(makeTable(10), ["2", "12"], "linear")
        table = buildDelete(table, "2", opts("linear")).slots
        table = buildInsert(table, "22", "22", opts("linear")).slots
        expect(table[2].entries[0].key).toBe("22")
        expect(table[2].tombstone).toBe(false)
    })

    it("rejects deleting a key that is not there", () => {
        const table = insertAll(makeTable(10), ["2"], "linear")
        expect(buildDelete(table, "99", opts("linear")).error).toMatch(/not in the table/)
    })
})

describe("frames", () => {
    it("counts probes in the snapshot", () => {
        const table = insertAll(makeTable(10), ["2", "12", "22"], "linear")
        const { frames } = buildSearch(table, "22", opts("linear"))
        expect(frames[frames.length - 1].snapshot.probes).toBeGreaterThan(1)
    })

    it("reports the home slot on every frame", () => {
        const { frames } = buildInsert(makeTable(10), "42", "x", opts("linear"))
        for (const frame of frames) expect(frame.snapshot.home).toBe(2)
    })

    it("returns no frames when it errors, so nothing half-animates", () => {
        const result = buildInsert(makeTable(10), "", "x", opts("linear"))
        expect(result.frames).toHaveLength(0)
        expect(result.error).toMatch(/Enter a key/)
    })

    it("leaves the input untouched when it errors", () => {
        const table = insertAll(makeTable(5), ["0", "1", "2", "3", "4"], "linear")
        const before = keysOf(table)
        buildInsert(table, "9", "9", opts("linear"))
        expect(keysOf(table)).toEqual(before)
    })

    it("puts the answer on the final frame", () => {
        const { frames, result } = buildInsert(makeTable(10), "42", "x", opts("linear"))
        expect(frames[frames.length - 1].snapshot.result).toBeTruthy()
        expect(result).toContain("42")
    })
})

describe("loadFactor", () => {
    it("is entries over slots", () => {
        const table = insertAll(makeTable(10), ["1", "2", "3"], "linear")
        expect(loadFactor(table)).toBeCloseTo(0.3)
    })

    it("can exceed one only with chaining", () => {
        const chained = insertAll(makeTable(5), ["0", "5", "10", "15", "20", "25"], "chaining")
        expect(loadFactor(chained)).toBeGreaterThan(1)
        const probed = insertAll(makeTable(5), ["0", "5", "10", "15", "20", "25"], "linear")
        expect(loadFactor(probed)).toBeLessThanOrEqual(1)
    })
})
