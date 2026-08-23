/**
 * Code templates for the algorithm visualizers.
 *
 * Real code in each language rather than pseudocode: a student should be able
 * to hold this beside their lab program and recognise it. Step numbers are the
 * `activeStep` values the matching visualizer emits.
 */

import { src, type CodeTemplate } from "@/lib/code-templates"

/**
 * Steps: 1 set the range, 2 take the middle, 3 compare, 4 found,
 * 5 go right, 6 go left, 7 exhausted.
 */
export const BINARY_SEARCH: CodeTemplate = {
    title: "Binary search",
    sources: {
        python: src(`
def binary_search(a, target):
    low, high = 0, len(a) - 1
    while low <= high:
        mid = (low + high) // 2
        if a[mid] == target:
            return mid
        elif a[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`, ". 1 2 2 3 4 . 5 . 6 7"),

        c: src(`
int binary_search(int a[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (a[mid] == target) {
            return mid;
        } else if (a[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`, ". 1 2 2 3 4 . 5 . 6 . . 7 ."),

        cpp: src(`
int binary_search(const std::vector<int>& a, int target) {
    int low = 0, high = static_cast<int>(a.size()) - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (a[mid] == target) {
            return mid;
        } else if (a[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`, ". 1 2 2 3 4 . 5 . 6 . . 7 ."),

        java: src(`
int binarySearch(int[] a, int target) {
    int low = 0, high = a.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (a[mid] == target) {
            return mid;
        } else if (a[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`, ". 1 2 2 3 4 . 5 . 6 . . 7 ."),

        rust: src(`
fn binary_search(a: &[i32], target: i32) -> Option<usize> {
    let (mut low, mut high) = (0usize, a.len());
    while low < high {
        let mid = low + (high - low) / 2;
        if a[mid] == target {
            return Some(mid);
        } else if a[mid] < target {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    None
}`, ". 1 2 2 3 4 . 5 . 6 . . 7 ."),
    },
}

/**
 * Steps: 1 choose the pivot, 2 compare against it, 3 swap into the smaller
 * side, 4 put the pivot in place, 5 recurse.
 */
export const QUICK_SORT: CodeTemplate = {
    title: "Quick sort",
    sources: {
        python: src(`
def quick_sort(a, low, high):
    if low < high:
        p = partition(a, low, high)
        quick_sort(a, low, p - 1)
        quick_sort(a, p + 1, high)

def partition(a, low, high):
    pivot = a[high]
    i = low - 1
    for j in range(low, high):
        if a[j] < pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[high] = a[high], a[i + 1]
    return i + 1`, ". . . 5 5 . . 1 . 2 2 3 3 4 ."),

        c: src(`
void quick_sort(int a[], int low, int high) {
    if (low < high) {
        int p = partition(a, low, high);
        quick_sort(a, low, p - 1);
        quick_sort(a, p + 1, high);
    }
}

int partition(int a[], int low, int high) {
    int pivot = a[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (a[j] < pivot) {
            i++;
            swap(&a[i], &a[j]);
        }
    }
    swap(&a[i + 1], &a[high]);
    return i + 1;
}`, ". . . 5 5 . . . . 1 . 2 2 3 3 . . 4 . ."),

        cpp: src(`
void quick_sort(std::vector<int>& a, int low, int high) {
    if (low < high) {
        int p = partition(a, low, high);
        quick_sort(a, low, p - 1);
        quick_sort(a, p + 1, high);
    }
}

int partition(std::vector<int>& a, int low, int high) {
    int pivot = a[high];
    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (a[j] < pivot) {
            std::swap(a[++i], a[j]);
        }
    }
    std::swap(a[i + 1], a[high]);
    return i + 1;
}`, ". . . 5 5 . . . . 1 . 2 2 3 . . 4 . ."),

        java: src(`
void quickSort(int[] a, int low, int high) {
    if (low < high) {
        int p = partition(a, low, high);
        quickSort(a, low, p - 1);
        quickSort(a, p + 1, high);
    }
}

int partition(int[] a, int low, int high) {
    int pivot = a[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (a[j] < pivot) {
            i++;
            swap(a, i, j);
        }
    }
    swap(a, i + 1, high);
    return i + 1;
}`, ". . . 5 5 . . . . 1 . 2 2 3 3 . . 4 . ."),

        rust: src(`
fn quick_sort(a: &mut [i32], low: isize, high: isize) {
    if low < high {
        let p = partition(a, low, high);
        quick_sort(a, low, p - 1);
        quick_sort(a, p + 1, high);
    }
}

fn partition(a: &mut [i32], low: isize, high: isize) -> isize {
    let pivot = a[high as usize];
    let mut i = low - 1;
    for j in low..high {
        if a[j as usize] < pivot {
            i += 1;
            a.swap(i as usize, j as usize);
        }
    }
    a.swap((i + 1) as usize, high as usize);
    i + 1
}`, ". . . 5 5 . . . . 1 . 2 2 3 3 . . 4 . ."),
    },
}

/**
 * Merge sort, as taught under divide and conquer.
 * Steps: 1 split, 2 recurse, 3 compare the fronts, 4 copy across, 5 drain.
 */
export const MERGE_SORT: CodeTemplate = {
    title: "Merge sort",
    sources: {
        python: src(`
def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left = merge_sort(a[:mid])
    right = merge_sort(a[mid:])
    return merge(left, right)

def merge(left, right):
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out`, ". . . 1 2 2 . . . . 3 3 4 . 4 5 5 ."),

        c: src(`
void merge_sort(int a[], int low, int high) {
    if (low >= high) return;
    int mid = low + (high - low) / 2;
    merge_sort(a, low, mid);
    merge_sort(a, mid + 1, high);
    merge(a, low, mid, high);
}

void merge(int a[], int low, int mid, int high) {
    int tmp[MAX], i = low, j = mid + 1, k = 0;
    while (i <= mid && j <= high) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else              tmp[k++] = a[j++];
    }
    while (i <= mid)  tmp[k++] = a[i++];
    while (j <= high) tmp[k++] = a[j++];
    for (int t = 0; t < k; t++) a[low + t] = tmp[t];
}`, ". . 1 2 2 . . . . . 3 4 4 . 5 5 . ."),

        cpp: src(`
void merge_sort(std::vector<int>& a, int low, int high) {
    if (low >= high) return;
    int mid = low + (high - low) / 2;
    merge_sort(a, low, mid);
    merge_sort(a, mid + 1, high);
    merge(a, low, mid, high);
}

void merge(std::vector<int>& a, int low, int mid, int high) {
    std::vector<int> tmp;
    int i = low, j = mid + 1;
    while (i <= mid && j <= high) {
        if (a[i] <= a[j]) tmp.push_back(a[i++]);
        else              tmp.push_back(a[j++]);
    }
    while (i <= mid)  tmp.push_back(a[i++]);
    while (j <= high) tmp.push_back(a[j++]);
    std::copy(tmp.begin(), tmp.end(), a.begin() + low);
}`, ". . 1 2 2 . . . . . . 3 4 4 . 5 5 . ."),

        java: src(`
void mergeSort(int[] a, int low, int high) {
    if (low >= high) return;
    int mid = low + (high - low) / 2;
    mergeSort(a, low, mid);
    mergeSort(a, mid + 1, high);
    merge(a, low, mid, high);
}

void merge(int[] a, int low, int mid, int high) {
    int[] tmp = new int[high - low + 1];
    int i = low, j = mid + 1, k = 0;
    while (i <= mid && j <= high) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else              tmp[k++] = a[j++];
    }
    while (i <= mid)  tmp[k++] = a[i++];
    while (j <= high) tmp[k++] = a[j++];
    System.arraycopy(tmp, 0, a, low, tmp.length);
}`, ". . 1 2 2 . . . . . . 3 4 4 . 5 5 . ."),

        rust: src(`
fn merge_sort(a: &[i32]) -> Vec<i32> {
    if a.len() <= 1 {
        return a.to_vec();
    }
    let mid = a.len() / 2;
    let left = merge_sort(&a[..mid]);
    let right = merge_sort(&a[mid..]);
    merge(&left, &right)
}

fn merge(left: &[i32], right: &[i32]) -> Vec<i32> {
    let (mut out, mut i, mut j) = (Vec::new(), 0, 0);
    while i < left.len() && j < right.len() {
        if left[i] <= right[j] { out.push(left[i]); i += 1; }
        else                   { out.push(right[j]); j += 1; }
    }
    out.extend_from_slice(&left[i..]);
    out.extend_from_slice(&right[j..]);
    out
}`, ". . . . 1 2 2 . . . . . 3 4 4 . 5 5 . ."),
    },
}

/**
 * The three depth-first traversals. Each is the same three actions in a
 * different order, which is exactly the point, so they are separate templates
 * rather than one with a comment underneath.
 *
 * Steps: 1 recurse left, 2 visit, 3 recurse right.
 */
export const IN_ORDER: CodeTemplate = {
    title: "In-order traversal",
    sources: {
        python: src(`
def in_order(node):
    if node is None:
        return
    in_order(node.left)
    visit(node)
    in_order(node.right)`, ". . . 1 2 3"),
        c: src(`
void in_order(Node *node) {
    if (node == NULL) return;
    in_order(node->left);
    visit(node);
    in_order(node->right);
}`, ". . 1 2 3 ."),
        cpp: src(`
void in_order(Node* node) {
    if (!node) return;
    in_order(node->left);
    visit(node);
    in_order(node->right);
}`, ". . 1 2 3 ."),
        java: src(`
void inOrder(Node node) {
    if (node == null) return;
    inOrder(node.left);
    visit(node);
    inOrder(node.right);
}`, ". . 1 2 3 ."),
        rust: src(`
fn in_order(node: &Option<Box<Node>>) {
    if let Some(n) = node {
        in_order(&n.left);
        visit(n);
        in_order(&n.right);
    }
}`, ". . 1 2 3 . ."),
    },
}

export const PRE_ORDER: CodeTemplate = {
    title: "Pre-order traversal",
    sources: {
        python: src(`
def pre_order(node):
    if node is None:
        return
    visit(node)
    pre_order(node.left)
    pre_order(node.right)`, ". . . 2 1 3"),
        c: src(`
void pre_order(Node *node) {
    if (node == NULL) return;
    visit(node);
    pre_order(node->left);
    pre_order(node->right);
}`, ". . 2 1 3 ."),
        cpp: src(`
void pre_order(Node* node) {
    if (!node) return;
    visit(node);
    pre_order(node->left);
    pre_order(node->right);
}`, ". . 2 1 3 ."),
        java: src(`
void preOrder(Node node) {
    if (node == null) return;
    visit(node);
    preOrder(node.left);
    preOrder(node.right);
}`, ". . 2 1 3 ."),
        rust: src(`
fn pre_order(node: &Option<Box<Node>>) {
    if let Some(n) = node {
        visit(n);
        pre_order(&n.left);
        pre_order(&n.right);
    }
}`, ". . 2 1 3 . ."),
    },
}

export const POST_ORDER: CodeTemplate = {
    title: "Post-order traversal",
    sources: {
        python: src(`
def post_order(node):
    if node is None:
        return
    post_order(node.left)
    post_order(node.right)
    visit(node)`, ". . . 1 3 2"),
        c: src(`
void post_order(Node *node) {
    if (node == NULL) return;
    post_order(node->left);
    post_order(node->right);
    visit(node);
}`, ". . 1 3 2 ."),
        cpp: src(`
void post_order(Node* node) {
    if (!node) return;
    post_order(node->left);
    post_order(node->right);
    visit(node);
}`, ". . 1 3 2 ."),
        java: src(`
void postOrder(Node node) {
    if (node == null) return;
    postOrder(node.left);
    postOrder(node.right);
    visit(node);
}`, ". . 1 3 2 ."),
        rust: src(`
fn post_order(node: &Option<Box<Node>>) {
    if let Some(n) = node {
        post_order(&n.left);
        post_order(&n.right);
        visit(n);
    }
}`, ". . 1 3 2 . ."),
    },
}

/** Keyed by the visualizer's traversal select value. */
export const TRAVERSALS: Record<string, CodeTemplate> = {
    inorder: IN_ORDER,
    preorder: PRE_ORDER,
    postorder: POST_ORDER,
}

/**
 * Steps: 1 walk down comparing, 2 go left, 3 go right, 4 attach.
 */
export const BST_INSERT: CodeTemplate = {
    title: "Insert into a search tree",
    sources: {
        python: src(`
def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.value:
        root.left = insert(root.left, key)
    else:
        root.right = insert(root.right, key)
    return root`, ". . 4 1 2 . 3 ."),

        c: src(`
Node *insert(Node *root, int key) {
    if (root == NULL) {
        return new_node(key);
    }
    if (key < root->value) {
        root->left = insert(root->left, key);
    } else {
        root->right = insert(root->right, key);
    }
    return root;
}`, ". . 4 . 1 2 . 3 . . ."),

        cpp: src(`
Node* insert(Node* root, int key) {
    if (!root) {
        return new Node(key);
    }
    if (key < root->value) {
        root->left = insert(root->left, key);
    } else {
        root->right = insert(root->right, key);
    }
    return root;
}`, ". . 4 . 1 2 . 3 . . ."),

        java: src(`
Node insert(Node root, int key) {
    if (root == null) {
        return new Node(key);
    }
    if (key < root.value) {
        root.left = insert(root.left, key);
    } else {
        root.right = insert(root.right, key);
    }
    return root;
}`, ". . 4 . 1 2 . 3 . . ."),

        rust: src(`
fn insert(root: Option<Box<Node>>, key: i32) -> Option<Box<Node>> {
    match root {
        None => Some(Box::new(Node::new(key))),
        Some(mut n) => {
            if key < n.value {
                n.left = insert(n.left.take(), key);
            } else {
                n.right = insert(n.right.take(), key);
            }
            Some(n)
        }
    }
}`, ". . 4 . 1 2 . 3 . . . . ."),
    },
}
