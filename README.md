# Compiler Dependency and Task Optimization System

A responsive Flask website for task dependency input, graph visualization, topological sorting and cycle detection.

## Run on Windows
1. Install Python 3.10+.
2. Extract this ZIP and open a terminal inside the extracted folder.
3. Run `py -m pip install -r requirements.txt`
4. Run `py app.py`
5. Open http://127.0.0.1:5000 in Chrome.

## Input format
Tasks: `Parse, Compile-A, Compile-B, Link`

Dependencies: one per line. `A B` or `A -> B` means A must finish before B.

## Algorithm
Kahn's topological sorting algorithm. Time complexity: O(V + E).

## Scope
This prototype calculates dependency order and detects cycles. It does not compile source code or execute tasks in parallel.
