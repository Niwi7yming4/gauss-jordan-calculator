class GaussJordanCalculator {
    constructor() {
        this.matrixSize = 4;
        this.useFractions = true; // 預設使用分數
        this.tolerance = 1e-9;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createMatrixGrid();
        document.getElementById('useFractions').checked = this.useFractions;
    }

    setupEventListeners() {
        document.getElementById('updateMatrix').addEventListener('click', () => {
            const val = parseInt(document.getElementById('matrixSize').value);
            this.matrixSize = (Number.isInteger(val) && val > 0) ? val : 4;
            this.createMatrixGrid();
        });

        document.getElementById('useFractions').addEventListener('change', (e) => {
            this.useFractions = e.target.checked;
        });

        document.getElementById('fillExample').addEventListener('click', () => {
            this.fillExampleMatrix();
        });

        document.getElementById('calculate').addEventListener('click', () => {
            this.calculate();
        });

        document.getElementById('clear').addEventListener('click', () => {
            this.clear();
        });
    }

    createMatrixGrid() {
        const container = document.getElementById('matrixContainer');
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'matrix-grid';
        const headerRow = document.createElement('div');
        headerRow.className = 'matrix-row';
        for (let j = 0; j < this.matrixSize; j++) {
            const headerCell = document.createElement('div');
            headerCell.className = 'matrix-cell matrix-header';
            headerCell.textContent = `x${j + 1}`;
            headerRow.appendChild(headerCell);
        }
        const separator = document.createElement('div');
        separator.className = 'matrix-separator';
        separator.textContent = '|';
        headerRow.appendChild(separator);
        const constantHeader = document.createElement('div');
        constantHeader.className = 'matrix-cell matrix-header';
        constantHeader.textContent = 'b';
        headerRow.appendChild(constantHeader);
        grid.appendChild(headerRow);

        for (let i = 0; i < this.matrixSize; i++) {
            const row = document.createElement('div');
            row.className = 'matrix-row';
            for (let j = 0; j < this.matrixSize + 1; j++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                const input = document.createElement('input');
                input.type = 'text';
                input.value = j < this.matrixSize ? (i === j ? '1' : '0') : '1';
                input.dataset.row = i;
                input.dataset.col = j;
                cell.appendChild(input);
                row.appendChild(cell);
                if (j === this.matrixSize - 1) {
                    const sep = document.createElement('div');
                    sep.className = 'matrix-separator';
                    sep.textContent = '|';
                    row.appendChild(sep);
                }
            }
            grid.appendChild(row);
        }
        container.appendChild(grid);
    }

    _getDataRows() {
        return Array.from(document.querySelectorAll('.matrix-row')).filter(r => r.querySelector('input'));
    }

    fillExampleMatrix() {
        const example = [
            [4, 3, 2, -1, 4],
            [5, 4, 3, -1, 4],
            [-2, -2, -1, 2, -3],
            [11, 6, 4, 1, 11]
        ];
        const rows = this._getDataRows();
        for (let i = 0; i < Math.min(rows.length, example.length); i++) {
            const inputs = Array.from(rows[i].querySelectorAll('input'));
            for (let j = 0; j < Math.min(inputs.length, example[i].length); j++) {
                inputs[j].value = String(example[i][j]);
            }
        }
    }

    getMatrix() {
        const rows = this._getDataRows();
        const matrix = [];
        for (let i = 0; i < this.matrixSize; i++) {
            const inputs = Array.from(rows[i].querySelectorAll('input'));
            const row = [];
            for (let j = 0; j < this.matrixSize + 1; j++) {
                if (!inputs[j]) throw new Error('矩陣輸入欄位不完整');
                const s = inputs[j].value.trim();
                if (s === '') throw new Error('請填寫所有矩陣元素');
                try {
                    if (this.useFractions) {
                        row.push(math.fraction(s));
                    } else {
                        const num = Number(s);
                        if (!isFinite(num)) throw new Error('無效數值: ' + s);
                        row.push(num);
                    }
                } catch (e) {
                    throw new Error(`無法解析數值 "${s}": ${e.message}`);
                }
            }
            matrix.push(row);
        }
        return matrix;
    }

    cloneForStep(matrix) {
        return matrix.map(row => row.map(val => this.useFractions ? math.clone(val) : Number(val)));
    }

    isZero(val) {
        if (this.useFractions) return math.equal(val, 0);
        return Math.abs(val) < this.tolerance;
    }

    absLarger(a, b) {
        if (this.useFractions) return math.larger(math.abs(a), math.abs(b));
        return Math.abs(a) > Math.abs(b);
    }

    formatValue(value) {
        if (typeof value === 'string') return value; 
        if (this.useFractions) {
            if (math.equal(value, math.floor(value))) return value.toString();
            return value.toFraction(true);
        }
        if (Math.abs(value) < this.tolerance) return '0';
        return math.format(value, { notation: 'fixed', precision: 4 });
    }

    formatMatrix(matrix) {
        let out = '';
        const n = matrix.length;
        for (let i = 0; i < n; i++) {
            out += i === 0 ? '⎡' : i < n - 1 ? '⎢' : '⎣';
            for (let j = 0; j < matrix[i].length; j++) {
                if (j === n) out += ' │ ';
                const s = this.formatValue(matrix[i][j]);
                out += s.toString().padStart(7) + ' ';
            }
            out += i === 0 ? '⎤\n' : i < n - 1 ? '⎥\n' : '⎦\n';
        }
        return out;
    }

    async calculate() {
        try {
            const originalMatrix = this.getMatrix();
            const result = await this.gaussJordanElimination(originalMatrix);
            const solutionToVerify = result.solution || result.particularSolution;
            if (solutionToVerify) {
                 const ok = this.verifySolution(originalMatrix, solutionToVerify);
                 if(ok) result.verified = true;
            }
            this.displayResult(result);
        } catch (err) {
            alert('計算錯誤: ' + (err && err.message ? err.message : String(err)));
            console.error(err);
        }
    }

    // ===================== 修正後的高斯-約旦消去法核心 =====================
    async gaussJordanElimination(matrix) {
        const n = matrix.length;
        const m = matrix[0].length;
        let A = this.cloneForStep(matrix);
        const steps = [{ description: '初始矩陣', matrix: this.cloneForStep(A) }];
        const pivotColOfRow = new Array(n).fill(-1);
        let pivot_r = 0;

        for (let c = 0; c < n && pivot_r < n; c++) {
            // 找 pivot row
            let pivotRowIdx = pivot_r;
            for (let k = pivot_r + 1; k < n; k++) {
                if (this.absLarger(A[k][c], A[pivotRowIdx][c])) pivotRowIdx = k;
            }
            if (this.isZero(A[pivotRowIdx][c])) continue;
            if (pivotRowIdx !== pivot_r) {
                [A[pivot_r], A[pivotRowIdx]] = [A[pivotRowIdx], A[pivot_r]];
                steps.push({ description: `交換 R${pivot_r+1} ↔ R${pivotRowIdx+1}`, matrix: this.cloneForStep(A) });
            }

            pivotColOfRow[pivot_r] = c;

            // 整數化 pivot row (只在分數模式下)
            if (this.useFractions) {
                const denominators = A[pivot_r].map(v => v.d ? v.d : 1);
                const lcm = denominators.reduce((a,b) => math.lcm(a,b), 1);
                if (lcm > 1) {
                    for (let j = 0; j < m; j++) A[pivot_r][j] = math.multiply(A[pivot_r][j], lcm);
                    steps.push({ description: `R${pivot_r+1} × ${lcm} (清除分母)`, matrix: this.cloneForStep(A) });
                }
            }

            // 使 pivot = 1
            const pivot = A[pivot_r][c];
            if (!this.isZero(pivot) && !math.equal(pivot, 1)) {
                for (let j = c; j < m; j++) {
                    A[pivot_r][j] = this.useFractions ? math.divide(A[pivot_r][j], pivot) : A[pivot_r][j]/pivot;
                }
                steps.push({ description: `R${pivot_r+1} ÷ ${this.formatValue(pivot)}`, matrix: this.cloneForStep(A) });
            }

            // 消去其它行
            for (let i = 0; i < n; i++) {
                if (i === pivot_r) continue;
                const factor = A[i][c];
                if (this.isZero(factor)) continue;
                
                for (let j = c; j < m; j++) {
                    A[i][j] = this.useFractions 
                        ? math.subtract(A[i][j], math.multiply(factor, A[pivot_r][j]))
                        : A[i][j] - factor * A[pivot_r][j];
                }
                
                // 只在數值有實際變化時記錄步驟
                let hasChange = false;
                for (let j = c; j < m; j++) {
                    if (!this.isZero(A[i][j])) {
                        hasChange = true;
                        break;
                    }
                }
                
                if (hasChange) {
                    steps.push({ 
                        description: `R${i+1} - (${this.formatValue(factor)}) × R${pivot_r+1}`, 
                        matrix: this.cloneForStep(A) 
                    });
                }
            }

            pivot_r++;
        }

        // 檢查是否有矛盾方程式
        for (let i = pivot_r; i < n; i++) {
            if (!this.isZero(A[i][m-1])) {
                return { steps, solution: null, message: '無解：存在矛盾方程式' };
            }
        }

        // 無限多組解處理
        if (pivot_r < n) {
            const freeVarCols = [], pivotCols = [];
            for (let i = 0; i < pivot_r; i++) pivotCols.push(pivotColOfRow[i]);
            for (let j = 0; j < n; j++) {
                if (!pivotCols.includes(j)) freeVarCols.push(j);
            }

            const particularSolution = new Array(n).fill(this.useFractions ? math.fraction(0) : 0);
            for (let i = 0; i < pivot_r; i++) {
                particularSolution[pivotColOfRow[i]] = A[i][m-1];
            }

            const paramNames = freeVarCols.map((_, idx) => `t${idx+1}`);
            const paramSolution = {};
            freeVarCols.forEach((col, idx) => {
                paramSolution[`x${col+1}`] = paramNames[idx];
            });

            for (let i = 0; i < pivot_r; i++) {
                const p_col = pivotColOfRow[i];
                let expr = this.formatValue(A[i][m-1]);
                
                for (let k = 0; k < freeVarCols.length; k++) {
                    const f_col = freeVarCols[k];
                    const coeff = A[i][f_col];
                    if (!this.isZero(coeff)) {
                        const coeffStr = this.formatValue(math.unaryMinus(coeff));
                        if (coeffStr.startsWith('-')) {
                            expr += ` + ${coeffStr.slice(1)}${paramNames[k]}`;
                        } else {
                            expr += ` - ${coeffStr}${paramNames[k]}`;
                        }
                    }
                }
                paramSolution[`x${p_col+1}`] = expr;
            }

            return { steps, paramSolution, particularSolution, message: '無限多組解' };
        }

        // 唯一解
        const solution = new Array(n).fill(this.useFractions ? math.fraction(0) : 0);
        for (let i = 0; i < n; i++) {
            solution[pivotColOfRow[i]] = A[i][m-1];
        }
        return { steps, solution, message: '唯一解' };
    }

    verifySolution(origAugmented, solution) {
        if (!solution) return false;
        const n = origAugmented.length;
        for (let i = 0; i < n; i++) {
            let lhs = this.useFractions ? math.fraction(0) : 0;
            for (let j = 0; j < n; j++) {
                const coeff = origAugmented[i][j], solj = solution[j];
                const prod = this.useFractions && typeof solj !== 'string' ? math.multiply(coeff, solj) : (typeof solj === 'string' ? 0 : coeff*solj);
                lhs = this.useFractions ? math.add(lhs, prod) : lhs + prod;
            }
            const rhs = origAugmented[i][n];
            const difference = math.abs(math.subtract(lhs, rhs));
            if (!this.isZero(difference)) return false;
        }
        return true;
    }

    displayResult(result) {
        const output = document.getElementById('resultOutput');
        let text = '🔢 高斯-約旦消去法計算過程\n';
        text += '═'.repeat(70) + '\n\n';
        if (!result || !result.steps || result.steps.length === 0) {
            output.textContent = '無結果'; return;
        }
        text += '📊 初始矩陣:\n';
        text += this.formatMatrix(result.steps[0].matrix) + '\n';
        if (result.steps.length > 1) {
            text += '🔄 計算步驟:\n';
            for (let i = 1; i < result.steps.length; i++) {
                const step = result.steps[i];
                text += `📝 步驟 ${i}: ${step.description}\n`;
                text += this.formatMatrix(step.matrix) + '\n';
            }
        }
        text += '✅ 最終結果:\n' + '─'.repeat(40) + '\n';
        text += `ℹ️ ${result.message}\n`;
        if (result.solution) {
            for (let i = 0; i < result.solution.length; i++)
                text += `x${i+1} = ${this.formatValue(result.solution[i])}\n`;
        } else if (result.particularSolution) {
            text += '\n代入自由變數為 0，可得特解：\n';
            for (let i = 0; i < result.particularSolution.length; i++)
                text += `x${i+1} = ${this.formatValue(result.particularSolution[i])}\n`;

            text += '\n完整參數化解：\n';
            const keys = Object.keys(result.paramSolution).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1)));
            for(const k of keys) text += `${k} = ${result.paramSolution[k]}\n`;
            text += '(t1, t2…為任意實數)\n';
        }
        text += result.verified ? '\n(✓ 解已驗證)\n' : '\n(❌ 解驗證失敗)\n';
        text += '═'.repeat(70) + '\n𝓢𝓸𝓵𝓾𝓽𝓲𝓸𝓷 𝓒𝓸𝓶𝓹𝓵𝓮𝓽𝓮 🎯\n';
        output.textContent = text;
    }

    clear() {
        const rows = this._getDataRows();
        for (let i = 0; i < rows.length; i++) {
            const inputs = Array.from(rows[i].querySelectorAll('input'));
            for (let j = 0; j < inputs.length; j++) {
                inputs[j].value = j < this.matrixSize ? (i === j ? '1' : '0') : '1';
            }
        }
        document.getElementById('resultOutput').textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof math === 'undefined') {
        alert('請先載入 math.js');
        return;
    }
    new GaussJordanCalculator();
});