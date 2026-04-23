export class BaseNonLinearSolver {
    constructor() {
        this.tolerance = 0.0001;
    }

    /**
     * The core mathematical iteration loop (Newton-Raphson / Gauss-Newton).
     * @param {Array<number>} state - 1D array of mathematical variables
     * @param {Function} errorFunc - Callback that returns an array of errors given a state
     * @param {number} maxIter - Maximum iterations
     * @param {Array<number>} weights - Optional weights. Heavy points move extremely slowly.
     */
    solveSystem(state, errorFunc, maxIter = 50, weights = null) {
        if (!weights) weights = state.map(() => 1);

        console.log(`[Solver] Starting solveSystem with ${state.length} variables, maxIter=${maxIter}`);

        for (let iter = 0; iter < maxIter; iter++) {
            let F = errorFunc(state);
            
            let maxError = Math.max(0, ...F.map(Math.abs));
            
            // Log iteration progress
            if (iter === 0 || iter % 10 === 0 || maxError < this.tolerance) {
                console.log(`[Solver] Iteration ${iter}: maxError = ${maxError.toFixed(6)}`);
            }

            // Stop if exploded to NaN or Infinity
            if (!isFinite(maxError)) {
                console.error(`[Solver] Error: Mathematical explosion detected (NaN/Infinity). Aborting solve.`);
                break;
            }

            if (maxError < this.tolerance) {
                console.log(`[Solver] Converged successfully at iteration ${iter}!`);
                break; // Solved successfully
            }

            let J = this.computeJacobian(state, errorFunc);
            let delta = this.solveGaussNewton(J, F.map(val => -val), weights); 

            for (let i = 0; i < state.length; i++) {
                // The linear DLS solver naturally handles structural weights via matrix diagonal Tikhonov damping
                // Step sizes are fully solved, just add delta.
                if (isFinite(delta[i])) {
                    state[i] += delta[i];
                }
            }
        }
        console.log(`[Solver] Finished loop. Returning new state.`);
        return state;
    }

    /**
     * Pure mathematical numerical differentiation.
     */
    computeJacobian(state, errorFunc) {
        const h = 0.0001; 
        let J = [];
        let F0 = errorFunc(state);
        
        for (let i = 0; i < F0.length; i++) {
            J[i] = [];
            for (let j = 0; j < state.length; j++) {
                let state_h = [...state];
                state_h[j] += h;
                
                let F1 = errorFunc(state_h);
                let derivative = (F1[i] - F0[i]) / h;
                J[i].push(derivative);
            }
        }
        return J;
    }

    /**
     * Linear algebra solver wrapper (Damped Least-Squares)
     * Solves roughly: (J^T * J + diag(W)) * delta = J^T * -F
     */
    solveGaussNewton(Jacobian, negativeF, weights) {
        const numEqs = Jacobian.length; // M
        const numVars = Jacobian[0]?.length || 0; // N
        if (numVars === 0 || numEqs === 0) return weights.map(()=>0);

        // Compute A = J^T * J
        let A = Array(numVars).fill(0).map(() => Array(numVars).fill(0));
        let b = Array(numVars).fill(0);

        for (let i = 0; i < numVars; i++) {
            for (let j = 0; j < numVars; j++) {
                let sum = 0;
                for (let k = 0; k < numEqs; k++) {
                    sum += Jacobian[k][i] * Jacobian[k][j];
                }
                A[i][j] = sum;
            }
            
            // Add diagonal damping (Weights). 
            // Also adds small epsilon to prevent singularity if unconstrained.
            // Increased the scale of damping slightly so the graph depth weights take effect visually
            A[i][i] += (weights ? weights[i] : 1) * 1e-4 + 1e-6; 

            // Compute b = J^T * -F
            let bSum = 0;
            for (let k = 0; k < numEqs; k++) {
                bSum += Jacobian[k][i] * negativeF[k];
            }
            b[i] = bSum;
        }

        // Gaussian Elimination to solve A * delta = b
        return this.gaussianElimination(A, b);
    }

    gaussianElimination(A, b) {
        const n = b.length;
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxEl = Math.abs(A[i][i]);
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(A[k][i]) > maxEl) {
                    maxEl = Math.abs(A[k][i]);
                    maxRow = k;
                }
            }

            // Swap max row with current row
            let tmpA = A[maxRow];
            A[maxRow] = A[i];
            A[i] = tmpA;
            let tmpB = b[maxRow];
            b[maxRow] = b[i];
            b[i] = tmpB;

            // Make all rows below this one 0 in current column
            for (let k = i + 1; k < n; k++) {
                let c = -A[k][i] / A[i][i];
                for (let j = i; j < n; j++) {
                    if (i === j) {
                        A[k][j] = 0;
                    } else {
                        A[k][j] += c * A[i][j];
                    }
                }
                b[k] += c * b[i];
            }
        }

        // Back substitution
        let x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            if (Math.abs(A[i][i]) < 1e-10) {
                x[i] = 0; // Singular fallback
            } else {
                let sum = 0;
                for (let j = i + 1; j < n; j++) {
                    sum += A[i][j] * x[j];
                }
                x[i] = (b[i] - sum) / A[i][i];
            }
        }
        return x;
    }
}
