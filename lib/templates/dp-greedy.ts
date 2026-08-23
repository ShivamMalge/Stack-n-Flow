/**
 * Code templates for the greedy and dynamic-programming visualizers.
 *
 * Step numbers are the `activeStep` values the matching visualizer emits.
 */

import { src, type CodeTemplate } from "@/lib/code-templates"

/**
 * Greedy change-making.
 * Steps: 1 sort descending, 2 consider a denomination, 3 take it, 4 skip it,
 * 5 done.
 *
 * Worth knowing: greedy is only optimal for a *canonical* coin system. With
 * denominations 1, 3, 4 and a target of 6 it returns 4+1+1 where 3+3 is better.
 */
export const COIN_CHANGE: CodeTemplate = {
    title: "Greedy change-making",
    sources: {
        python: src(`
def make_change(coins, amount):
    coins.sort(reverse=True)
    chosen = []
    for coin in coins:
        while coin <= amount:
            chosen.append(coin)
            amount -= coin
    return chosen if amount == 0 else None`, ". 1 . 2 3 3 3 5"),

        c: src(`
int make_change(int coins[], int n, int amount, int chosen[]) {
    qsort(coins, n, sizeof(int), desc);
    int k = 0;
    for (int i = 0; i < n; i++) {
        while (coins[i] <= amount) {
            chosen[k++] = coins[i];
            amount -= coins[i];
        }
    }
    return amount == 0 ? k : -1;
}`, ". 1 . 2 3 3 3 . . 5 ."),

        cpp: src(`
std::vector<int> make_change(std::vector<int> coins, int amount) {
    std::sort(coins.rbegin(), coins.rend());
    std::vector<int> chosen;
    for (int coin : coins) {
        while (coin <= amount) {
            chosen.push_back(coin);
            amount -= coin;
        }
    }
    return amount == 0 ? chosen : std::vector<int>{};
}`, ". 1 . 2 3 3 3 . . 5 ."),

        java: src(`
List<Integer> makeChange(int[] coins, int amount) {
    Arrays.sort(coins);
    List<Integer> chosen = new ArrayList<>();
    for (int i = coins.length - 1; i >= 0; i--) {
        while (coins[i] <= amount) {
            chosen.add(coins[i]);
            amount -= coins[i];
        }
    }
    return amount == 0 ? chosen : null;
}`, ". 1 . 2 3 3 3 . . 5 ."),

        rust: src(`
fn make_change(mut coins: Vec<u32>, mut amount: u32) -> Option<Vec<u32>> {
    coins.sort_unstable_by(|a, b| b.cmp(a));
    let mut chosen = Vec::new();
    for coin in coins {
        while coin <= amount {
            chosen.push(coin);
            amount -= coin;
        }
    }
    if amount == 0 { Some(chosen) } else { None }
}`, ". 1 . 2 3 3 3 . . 5 ."),
    },
}

/**
 * Bottom-up Fibonacci, the smallest honest example of a DP table.
 * Steps: 1 make the table, 2 base cases, 3 fill from the two below, 4 answer.
 */
export const FIBONACCI_DP: CodeTemplate = {
    title: "Fibonacci (bottom-up)",
    sources: {
        python: src(`
def fib(n):
    table = [None] * (n + 1)
    table[0] = 0
    table[1] = 1
    for i in range(2, n + 1):
        table[i] = table[i - 1] + table[i - 2]
    return table[n]`, ". 1 2 2 . 3 4"),

        c: src(`
long fib(int n) {
    long table[MAX];
    table[0] = 0;
    table[1] = 1;
    for (int i = 2; i <= n; i++) {
        table[i] = table[i - 1] + table[i - 2];
    }
    return table[n];
}`, ". 1 2 2 . 3 . 4 ."),

        cpp: src(`
long long fib(int n) {
    std::vector<long long> table(n + 1);
    table[0] = 0;
    table[1] = 1;
    for (int i = 2; i <= n; ++i) {
        table[i] = table[i - 1] + table[i - 2];
    }
    return table[n];
}`, ". 1 2 2 . 3 . 4 ."),

        java: src(`
long fib(int n) {
    long[] table = new long[n + 1];
    table[0] = 0;
    table[1] = 1;
    for (int i = 2; i <= n; i++) {
        table[i] = table[i - 1] + table[i - 2];
    }
    return table[n];
}`, ". 1 2 2 . 3 . 4 ."),

        rust: src(`
fn fib(n: usize) -> u64 {
    let mut table = vec![0u64; n + 1];
    table[0] = 0;
    table[1] = 1;
    for i in 2..=n {
        table[i] = table[i - 1] + table[i - 2];
    }
    table[n]
}`, ". 1 2 2 . 3 . 4 ."),
    },
}

/**
 * 0/1 knapsack.
 * Steps: 1 zero the table, 2 the item does not fit so carry the row above down,
 * 3 choose the better of taking and skipping, 4 read the answer.
 */
export const KNAPSACK_DP: CodeTemplate = {
    title: "0/1 knapsack",
    sources: {
        python: src(`
def knapsack(items, capacity):
    n = len(items)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        w, v = items[i - 1]
        for c in range(capacity + 1):
            if w > c:
                dp[i][c] = dp[i - 1][c]
            else:
                dp[i][c] = max(dp[i - 1][c], v + dp[i - 1][c - w])
    return dp[n][capacity]`, ". . 1 . . . . 2 . 3 4"),

        c: src(`
int knapsack(Item items[], int n, int capacity) {
    int dp[MAX_N + 1][MAX_CAP + 1] = {0};
    for (int i = 1; i <= n; i++) {
        int w = items[i - 1].weight, v = items[i - 1].value;
        for (int c = 0; c <= capacity; c++) {
            if (w > c) {
                dp[i][c] = dp[i - 1][c];
            } else {
                dp[i][c] = max(dp[i - 1][c], v + dp[i - 1][c - w]);
            }
        }
    }
    return dp[n][capacity];
}`, ". 1 . . . . 2 . 3 . . . 4 ."),

        cpp: src(`
int knapsack(const std::vector<Item>& items, int capacity) {
    int n = items.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(capacity + 1, 0));
    for (int i = 1; i <= n; ++i) {
        int w = items[i - 1].weight, v = items[i - 1].value;
        for (int c = 0; c <= capacity; ++c) {
            if (w > c) {
                dp[i][c] = dp[i - 1][c];
            } else {
                dp[i][c] = std::max(dp[i - 1][c], v + dp[i - 1][c - w]);
            }
        }
    }
    return dp[n][capacity];
}`, ". . 1 . . . . 2 . 3 . . . 4 ."),

        java: src(`
int knapsack(Item[] items, int capacity) {
    int n = items.length;
    int[][] dp = new int[n + 1][capacity + 1];
    for (int i = 1; i <= n; i++) {
        int w = items[i - 1].weight, v = items[i - 1].value;
        for (int c = 0; c <= capacity; c++) {
            if (w > c) {
                dp[i][c] = dp[i - 1][c];
            } else {
                dp[i][c] = Math.max(dp[i - 1][c], v + dp[i - 1][c - w]);
            }
        }
    }
    return dp[n][capacity];
}`, ". . 1 . . . . 2 . 3 . . . 4 ."),

        rust: src(`
fn knapsack(items: &[Item], capacity: usize) -> u32 {
    let n = items.len();
    let mut dp = vec![vec![0u32; capacity + 1]; n + 1];
    for i in 1..=n {
        let (w, v) = (items[i - 1].weight, items[i - 1].value);
        for c in 0..=capacity {
            if w > c {
                dp[i][c] = dp[i - 1][c];
            } else {
                dp[i][c] = dp[i - 1][c].max(v + dp[i - 1][c - w]);
            }
        }
    }
    dp[n][capacity]
}`, ". . 1 . . . . 2 . 3 . . . 4 ."),
    },
}
