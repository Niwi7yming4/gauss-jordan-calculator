class GaussJordanCalculator {
    constructor() {
        this.matrixSize = 4;
        this.useFractions = true;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createMatrixGrid();
    }

    setupEventListeners() {
        document.getElementById('updateMatrix').addEventListener('click', () => {
            this.matrixSize = parseInt(document.getElementById('matrixSize').value);
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

        // 標題行
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

        // 輸入行
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

    fillExampleMatrix() {
        const exampleMatrix = [
            [4, 3, 2, -1, 4],
            [5, 4, 3, -1, 4],
            [-2, -2, -1, 2, -3],
            [11, 6, 4, 1, 11]
        ];

        const inputs = document.querySelectorAll('.matrix-cell input');
        inputs.forEach((input, index) => {
            const row = Math.floor(index / (this.matrixSize + 1));
            const col = index % (this.matrixSize + 1);
            if (row < exampleMatrix.length && col < exampleMatrix[0].length) {
                input.value = exampleMatrix[row][col];
            }
        });
    }

    getMatrix() {
        const inputs = document.querySelectorAll('.matrix-cell input');
        const matrix = [];
        let currentRow = [];

        inputs.forEach((input) => {
            const value = input.value.trim();
            if (!value) throw new Error('請填寫所有矩陣元素');

            let numValue;
            if (this.useFractions && value.includes('/')) {
                const [numerator, denominator] = value.split('/').map(Number);
                numValue = math.fraction(numerator, denominator);
            } else {
                numValue = this.useFractions ? math.fraction(Number(value)) : Number(value);
            }

            currentRow.push(numValue);

            if (currentRow.length === this.matrixSize + 1) {
                matrix.push(currentRow);
                currentRow = [];
            }
        });

        return matrix;
    }

    formatValue(value) {
        if (math.isFraction(value)) {
            const f = math.fraction(value);
            if (math.equal(f.d, 1)) return f.n.toString();
            return `${f.n}/${f.d}`;
        }
        return math.format(value, { precision: 6 });
    }

    formatMatrix(matrix) {
        let output = '';
        const n = matrix.length;
        for (let i = 0; i < n; i++) {
            output += i === 0 ? '⎡' : i < n - 1 ? '⎢' : '⎣';
            for (let j = 0; j < matrix[i].length; j++) {
                if (j === n) output += ' │ ';
                output += this.formatValue(matrix[i][j]).padStart(8) + ' ';
            }
            output += i === 0 ? '⎤\n' : i < n - 1 ? '⎥\n' : '⎦\n';
        }
        return output;
    }

    async calculate() {
        try {
            const matrix = this.getMatrix();
            const result = await this.gaussJordanElimination(matrix);
            this.displayResult(result);
        } catch (error) {
            alert(error.message);
        }
    }

    async gaussJordanElimination(matrix) {
        const n = matrix.length;
        const m = this.matrixSize + 1;
        let augmented = math.clone(matrix.map(row => row.map(v => math.fraction(v))));
        const steps = [];

        steps.push({ description: '初始矩陣', matrix: math.clone(augmented) });

        for (let i = 0; i < n; i++) {
            let pivot = augmented[i][i];

            // 換行
            if (math.equal(pivot, 0)) {
                // 檢查是否存在下面行可以交換
                let swapRow = -1;
                for (let k = i + 1; k < n; k++) {
                    if (!augmented[k].slice(i).every(x => math.equal(x, 0))) {
                        swapRow = k;
                        break;
                    }
                }
                if (swapRow === -1) {
                    // 如果整列下面都是0，判斷該行是否也全零
                    if (augmented[i].slice(i, m - 1).every(x => math.equal(x, 0)) &&
                        math.equal(augmented[i][m - 1], 0)) {
                        // 整行為 0，跳過
                        continue;
                    } else {
                        return { steps, solution: null, message: '❌ 無解' };
                    }
                }
                // 交換行
                [augmented[i], augmented[swapRow]] = [augmented[swapRow], augmented[i]];
                steps.push({ description: `交換 R${i + 1} ↔ R${swapRow + 1}`, matrix: math.clone(augmented) });
                pivot = augmented[i][i];
            }


            // 歸一化主元
            if (!math.equal(pivot, 1)) {
                for (let col = 0; col < m; col++) {
                    augmented[i][col] = math.divide(augmented[i][col], pivot);
                }
                steps.push({ description: `R${i + 1} ÷ ${this.formatValue(pivot)}`, matrix: math.clone(augmented) });
            }

            // 消去其他行
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    const factor = augmented[j][i];
                    if (!math.equal(factor, 0)) {
                        for (let col = 0; col < m; col++) {
                            augmented[j][col] = math.subtract(augmented[j][col], math.multiply(factor, augmented[i][col]));
                        }
                        steps.push({ description: `R${j + 1} - (${this.formatValue(factor)})*R${i + 1}`, matrix: math.clone(augmented) });
                    }
                }
            }
        }

        const solution = augmented.map(row => row[m - 1]);
        return { steps, solution, message: '成功求解' };
    }

    displayResult(result) {
        const output = document.getElementById('resultOutput');
        let text = '🔢 高斯-約旦消去法計算過程\n';
        text += '═'.repeat(70) + '\n\n';

        text += '📊 計算步驟:\n';
        for (let i = 0; i < result.steps.length; i++) {
            const step = result.steps[i];
            text += `Step ${i + 1}: ${step.description}\n`;
            text += this.formatMatrix(step.matrix) + '\n';
        }

        text += '✅ 最終結果:\n' + '─'.repeat(40) + '\n';
        if (result.solution) {
            result.solution.forEach((val, i) => {
                text += `x${i + 1} = ${this.formatValue(val)}\n`;
            });
        } else {
            text += `❌ ${result.message}\n`;
        }

        text += '\n' + '═'.repeat(70) + '\n';
        text += '𝓢𝓸𝓵𝓾𝓽𝓲𝓸𝓷 𝓒𝓸𝓶𝓹𝓵𝓮𝓽𝓮 🎯\n';
        output.textContent = text;
    }

    clear() {
        const inputs = document.querySelectorAll('.matrix-cell input');
        inputs.forEach(input => {
            const row = Number(input.dataset.row);
            const col = Number(input.dataset.col);
            input.value = col < this.matrixSize ? (row === col ? '1' : '0') : '1';
        });
        document.getElementById('resultOutput').textContent = '';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new GaussJordanCalculator();
});
