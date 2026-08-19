/**
 * Code templates for the sparse matrix transposes.
 *
 * Real, compilable-shaped code rather than pseudocode: a student comparing this
 * against their lab program in C should recognise it line for line. The step
 * numbers match the `activeLine` values emitted by lib/sparse-matrix.ts —
 * SIMPLE uses 1, 3 and 4; FAST uses 1, 3, 6 and 7.
 */

import { src, type CodeTemplate } from "@/lib/code-templates"

export const SIMPLE_TRANSPOSE: CodeTemplate = {
    title: "Simple transpose",
    sources: {
        python: src(`
def transpose(a, cols):
    b = []
    for c in range(cols):
        for t in a:
            if t.col == c:
                b.append(Term(c, t.row, t.value))
    return b`, ". . 1 . 3 4 ."),

        c: src(`
void transpose(Term a[], Term b[], int terms, int cols) {
    int n = 0;
    for (int c = 0; c < cols; c++) {
        for (int i = 0; i < terms; i++) {
            if (a[i].col == c) {
                b[n].row   = c;
                b[n].col   = a[i].row;
                b[n].value = a[i].value;
                n++;
            }
        }
    }
}`, ". . 1 . 3 4 4 4 4 . . . ."),

        cpp: src(`
std::vector<Term> transpose(const std::vector<Term>& a, int cols) {
    std::vector<Term> b;
    for (int c = 0; c < cols; ++c) {
        for (const Term& t : a) {
            if (t.col == c) {
                b.push_back({c, t.row, t.value});
            }
        }
    }
    return b;
}`, ". . 1 . 3 4 . . . . ."),

        java: src(`
List<Term> transpose(List<Term> a, int cols) {
    List<Term> b = new ArrayList<>();
    for (int c = 0; c < cols; c++) {
        for (Term t : a) {
            if (t.col == c) {
                b.add(new Term(c, t.row, t.value));
            }
        }
    }
    return b;
}`, ". . 1 . 3 4 . . . . ."),

        rust: src(`
fn transpose(a: &[Term], cols: usize) -> Vec<Term> {
    let mut b = Vec::new();
    for c in 0..cols {
        for t in a {
            if t.col == c {
                b.push(Term { row: c, col: t.row, value: t.value });
            }
        }
    }
    b
}`, ". . 1 . 3 4 . . . . ."),
    },
}

export const FAST_TRANSPOSE: CodeTemplate = {
    title: "Fast transpose",
    sources: {
        python: src(`
def fast_transpose(a, cols):
    row_terms = [0] * cols
    for t in a:
        row_terms[t.col] += 1

    starting_pos = [0] * cols
    for c in range(1, cols):
        starting_pos[c] = starting_pos[c - 1] + row_terms[c - 1]

    b = [None] * len(a)
    for t in a:
        j = starting_pos[t.col]
        b[j] = Term(t.col, t.row, t.value)
        starting_pos[t.col] += 1
    return b`, ". . 1 1 . 3 3 3 . . 6 6 6 7 ."),

        c: src(`
void fast_transpose(Term a[], Term b[], int terms, int cols) {
    int row_terms[MAX_COLS], starting_pos[MAX_COLS];

    for (int c = 0; c < cols; c++) row_terms[c] = 0;
    for (int i = 0; i < terms; i++) row_terms[a[i].col]++;

    starting_pos[0] = 0;
    for (int c = 1; c < cols; c++)
        starting_pos[c] = starting_pos[c - 1] + row_terms[c - 1];

    for (int i = 0; i < terms; i++) {
        int j = starting_pos[a[i].col];
        b[j].row   = a[i].col;
        b[j].col   = a[i].row;
        b[j].value = a[i].value;
        starting_pos[a[i].col]++;
    }
}`, ". . . . 1 . 3 3 3 . 6 6 6 6 6 7 . ."),

        cpp: src(`
std::vector<Term> fast_transpose(const std::vector<Term>& a, int cols) {
    std::vector<int> row_terms(cols, 0), starting_pos(cols, 0);

    for (const Term& t : a) row_terms[t.col]++;

    for (int c = 1; c < cols; ++c)
        starting_pos[c] = starting_pos[c - 1] + row_terms[c - 1];

    std::vector<Term> b(a.size());
    for (const Term& t : a) {
        int j = starting_pos[t.col];
        b[j] = {t.col, t.row, t.value};
        starting_pos[t.col]++;
    }
    return b;
}`, ". . . 1 . 3 3 . . 6 6 6 7 . . ."),

        java: src(`
Term[] fastTranspose(Term[] a, int cols) {
    int[] rowTerms = new int[cols];
    int[] startingPos = new int[cols];

    for (Term t : a) rowTerms[t.col]++;

    for (int c = 1; c < cols; c++)
        startingPos[c] = startingPos[c - 1] + rowTerms[c - 1];

    Term[] b = new Term[a.length];
    for (Term t : a) {
        int j = startingPos[t.col];
        b[j] = new Term(t.col, t.row, t.value);
        startingPos[t.col]++;
    }
    return b;
}`, ". . . . 1 . 3 3 . . 6 6 6 7 . . ."),

        rust: src(`
fn fast_transpose(a: &[Term], cols: usize) -> Vec<Term> {
    let mut row_terms = vec![0usize; cols];
    for t in a {
        row_terms[t.col] += 1;
    }

    let mut starting_pos = vec![0usize; cols];
    for c in 1..cols {
        starting_pos[c] = starting_pos[c - 1] + row_terms[c - 1];
    }

    let mut b = vec![Term::default(); a.len()];
    for t in a {
        let j = starting_pos[t.col];
        b[j] = Term { row: t.col, col: t.row, value: t.value };
        starting_pos[t.col] += 1;
    }
    b
}`, ". . 1 1 . . 3 3 3 . . . 6 6 6 7 . . ."),
    },
}
