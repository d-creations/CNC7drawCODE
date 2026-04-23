import { BaseNonLinearSolver } from './src/domain/math/solvers/BaseNonLinearSolver.js'; let sys = new BaseNonLinearSolver(); console.log(sys.solveGaussNewton([[1, 0], [0, 1]], [-10, -5], [1, 1]));
