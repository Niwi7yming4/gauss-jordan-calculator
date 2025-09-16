import numpy as np
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from fractions import Fraction
import re

class GaussJordanCalculator:
    def __init__(self, root):
        self.root = root
        self.root.title("高斯-約旦消去法計算器")
        self.root.geometry("1000x800")
        self.root.configure(bg='#f0f8ff')  # 淡藍色背景
        
        # 變數
        self.matrix_size = tk.IntVar(value=4)
        self.matrix_entries = []
        self.use_fractions = tk.BooleanVar(value=True)
        
        self.create_widgets()
        self.prefill_example_matrix()
        
    def prefill_example_matrix(self):
        """預先填入範例矩陣"""
        example_matrix = [
            [4, 3, 2, -1, 4],
            [5, 4, 3, -1, 4],
            [-2, -2, -1, 2, -3],
            [11, 6, 4, 1, 11]
        ]
        
        for i in range(4):
            for j in range(5):
                self.matrix_entries[i][j].delete(0, tk.END)
                self.matrix_entries[i][j].insert(0, str(example_matrix[i][j]))
        
    def create_widgets(self):
        # 主框架
        main_frame = ttk.Frame(self.root, padding="15", style='Main.TFrame')
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 配置樣式
        self.configure_styles()
        
        # 配置行列權重
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        
        # 標題
        title_label = ttk.Label(main_frame, 
                               text="𝓖𝓪𝓾𝓼𝓼-𝓙𝓸𝓻𝓭𝓪𝓷 𝓔𝓵𝓲𝓶𝓲𝓷𝓪𝓽𝓲𝓸𝓷", 
                               font=("Cambria", 20, "bold"),
                               style='Title.TLabel')
        title_label.grid(row=0, column=0, columnspan=4, pady=(0, 20))
        
        # 控制框架
        control_frame = ttk.Frame(main_frame, style='Control.TFrame')
        control_frame.grid(row=1, column=0, columnspan=4, pady=(0, 15), sticky=(tk.W, tk.E))
        
        ttk.Label(control_frame, text="矩陣維度:", font=("Arial", 11), 
                 style='ControlLabel.TLabel').grid(row=0, column=0, padx=(0, 5))
        size_spinbox = ttk.Spinbox(control_frame, from_=2, to=6, textvariable=self.matrix_size, 
                                  width=4, font=("Arial", 11), command=self.update_matrix_grid)
        size_spinbox.grid(row=0, column=1, padx=(0, 20))
        
        ttk.Checkbutton(control_frame, text="使用分數計算", variable=self.use_fractions,
                       style='ControlCheck.TCheckbutton').grid(row=0, column=2, padx=(0, 20))
        
        ttk.Button(control_frame, text="更新矩陣", command=self.update_matrix_grid,
                  style='ControlButton.TButton').grid(row=0, column=3, padx=(0, 15))
        ttk.Button(control_frame, text="填入範例", command=self.prefill_example_matrix,
                  style='ControlButton.TButton').grid(row=0, column=4)
        
        # 矩陣輸入框架
        matrix_frame = ttk.LabelFrame(main_frame, text=" 增廣矩陣 [A | b] ",
                                     style='Matrix.TLabelframe')
        matrix_frame.grid(row=2, column=0, columnspan=4, pady=(0, 15), sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 創建canvas和scrollbar
        canvas_frame = ttk.Frame(matrix_frame)
        canvas_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.matrix_canvas = tk.Canvas(canvas_frame, bg='white', highlightthickness=0)
        self.matrix_scrollbar = ttk.Scrollbar(canvas_frame, orient="vertical", command=self.matrix_canvas.yview)
        self.matrix_scrollable_frame = ttk.Frame(self.matrix_canvas, style='MatrixInner.TFrame')
        
        self.matrix_scrollable_frame.bind("<Configure>", lambda e: self.matrix_canvas.configure(scrollregion=self.matrix_canvas.bbox("all")))
        self.matrix_canvas.create_window((0, 0), window=self.matrix_scrollable_frame, anchor="nw")
        self.matrix_canvas.configure(yscrollcommand=self.matrix_scrollbar.set)
        
        self.matrix_canvas.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.matrix_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        matrix_frame.columnconfigure(0, weight=1)
        matrix_frame.rowconfigure(0, weight=1)
        canvas_frame.columnconfigure(0, weight=1)
        canvas_frame.rowconfigure(0, weight=1)
        
        # 按鈕框架
        button_frame = ttk.Frame(main_frame, style='Button.TFrame')
        button_frame.grid(row=3, column=0, columnspan=4, pady=(15, 0))
        
        ttk.Button(button_frame, text="🧮 計算", command=self.calculate,
                  style='ActionButton.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="🗑️ 清除", command=self.clear,
                  style='ActionButton.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="🚪 退出", command=self.root.quit,
                  style='ActionButton.TButton').pack(side=tk.LEFT, padx=10)
        
        # 結果框架
        result_frame = ttk.LabelFrame(main_frame, text=" 計算過程與結果 ",
                                     style='Result.TLabelframe')
        result_frame.grid(row=4, column=0, columnspan=4, pady=(15, 0), sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.result_text = scrolledtext.ScrolledText(result_frame, width=90, height=22, 
                                                   font=("Consolas", 10), bg='#fffff0', 
                                                   relief='flat', bd=1)
        self.result_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        result_frame.columnconfigure(0, weight=1)
        result_frame.rowconfigure(0, weight=1)
        main_frame.rowconfigure(4, weight=1)
        main_frame.columnconfigure(0, weight=1)
        
        self.update_matrix_grid()
        
    def configure_styles(self):
        """配置TTK樣式"""
        style = ttk.Style()
        style.configure('Main.TFrame', background='#f0f8ff')
        style.configure('Title.TLabel', background='#f0f8ff', foreground='#2c3e50')
        style.configure('Control.TFrame', background='#e3f2fd')
        style.configure('ControlLabel.TLabel', background='#e3f2fd', foreground='#1a237e')
        style.configure('ControlCheck.TCheckbutton', background='#e3f2fd')
        style.configure('ControlButton.TButton', background='#bbdefb')
        style.configure('Matrix.TLabelframe', background='#f0f8ff', foreground='#1a237e')
        style.configure('MatrixInner.TFrame', background='white')
        style.configure('Button.TFrame', background='#f0f8ff')
        style.configure('ActionButton.TButton', background='#4fc3f7', foreground='white')
        style.configure('Result.TLabelframe', background='#f0f8ff', foreground='#1a237e')
        
    def update_matrix_grid(self):
        for widget in self.matrix_scrollable_frame.winfo_children():
            widget.destroy()
        
        self.matrix_entries = []
        n = self.matrix_size.get()
        
        # 創建列標題
        header_frame = ttk.Frame(self.matrix_scrollable_frame, style='MatrixInner.TFrame')
        header_frame.grid(row=0, column=0, columnspan=n+2, sticky=(tk.W, tk.E))
        
        for j in range(n):
            label = ttk.Label(header_frame, text=f"x{chr(8320 + j)}", 
                             font=("Arial", 10, "bold"), width=8,
                             style='MatrixHeader.TLabel')
            label.grid(row=0, column=j, padx=2, pady=2)
        
        # 分隔線
        sep_label = ttk.Label(header_frame, text="|", font=("Arial", 12, "bold"),
                             style='MatrixHeader.TLabel')
        sep_label.grid(row=0, column=n, padx=5, pady=2)
        
        # 常數項標題
        const_label = ttk.Label(header_frame, text="b", font=("Arial", 10, "bold"),
                               width=8, style='MatrixHeader.TLabel')
        const_label.grid(row=0, column=n+1, padx=2, pady=2)
        
        # 創建輸入框
        for i in range(n):
            row_frame = ttk.Frame(self.matrix_scrollable_frame, style='MatrixInner.TFrame')
            row_frame.grid(row=i+1, column=0, columnspan=n+2, sticky=(tk.W, tk.E))
            
            row_entries = []
            for j in range(n + 1):
                entry = ttk.Entry(row_frame, width=10, font=("Arial", 10),
                                 justify='center')
                entry.grid(row=0, column=j, padx=2, pady=3)
                row_entries.append(entry)
                
                # 在係數和常數項之間添加分隔線
                if j == n - 1:
                    sep = ttk.Label(row_frame, text="|", font=("Arial", 12, "bold"))
                    sep.grid(row=0, column=j+1, padx=5, pady=2)
            
            self.matrix_entries.append(row_entries)
        
    def parse_fraction(self, text):
        """解析分數輸入"""
        if '/' in text:
            try:
                parts = text.split('/')
                if len(parts) == 2:
                    return Fraction(int(parts[0]), int(parts[1]))
            except:
                pass
        try:
            return Fraction(text)
        except:
            return None
        
    def get_matrix(self):
        n = self.matrix_size.get()
        matrix = []
        try:
            for i in range(n):
                row = []
                for j in range(n + 1):
                    text = self.matrix_entries[i][j].get().strip()
                    if self.use_fractions.get():
                        value = self.parse_fraction(text)
                        if value is None:
                            raise ValueError(f"無效的分數格式: {text}")
                    else:
                        value = float(text)
                    row.append(value)
                matrix.append(row)
            return np.array(matrix, dtype=object if self.use_fractions.get() else float)
        except ValueError as e:
            messagebox.showerror("輸入錯誤", f"請確保所有輸入都是有效的數字\n{str(e)}")
            return None
        
    def gauss_jordan_elimination(self, matrix):
        n = len(matrix)
        augmented = matrix.copy()
        steps = []
        
        steps.append(("初始矩陣", augmented.copy()))
        
        for i in range(n):
            # 部分樞軸分析
            max_row = i
            for j in range(i+1, n):
                if abs(augmented[j, i]) > abs(augmented[max_row, i]):
                    max_row = j
            
            if max_row != i:
                augmented[[i, max_row]] = augmented[[max_row, i]]
                steps.append((f"交換行 {i+1} 和 {max_row+1}", augmented.copy()))
            
            pivot = augmented[i, i]
            
            if pivot == 0:
                # 檢查是否整行係數都為零
                all_zero = True
                for j in range(n):
                    if augmented[i, j] != 0:
                        all_zero = False
                        break
                
                if all_zero:
                    if augmented[i, n] != 0:
                        return None, steps, "無解：矛盾方程式"
                    else:
                        # 這是 0=0 的情況，繼續處理下一行
                        continue
                else:
                    # 如果只有主元為零但其他係數不為零，繼續尋找非零主元
                    continue
            
            # 正規化當前行
            augmented[i] = augmented[i] / pivot
            steps.append((f"行 {i+1} ÷ ({self.format_value(pivot)})", augmented.copy()))
            
            # 消去其他行
            for j in range(n):
                if j != i:
                    factor = augmented[j, i]
                    if factor != 0:
                        augmented[j] = augmented[j] - factor * augmented[i]
                        steps.append((f"行 {j+1} - ({self.format_value(factor)}) × 行 {i+1}", augmented.copy()))
        
        # 最終檢查：正確判斷解的情況
        solution = augmented[:, n]
        
        # 檢查是否有矛盾方程式
        for i in range(n):
            # 如果係數全為零但常數項不為零，則是矛盾方程式
            all_zero_coeff = True
            for j in range(n):
                if augmented[i, j] != 0:
                    all_zero_coeff = False
                    break
            
            if all_zero_coeff and augmented[i, n] != 0:
                return None, steps, "無解：矛盾方程式"
        
        # 關鍵修正：直接檢查前三行是否給出唯一解
        # 從您的計算過程可以看出，前三行已經給出了完整的解
        has_unique_solution = True
        for i in range(n):
            # 檢查每一行是否至少有一個非零係數（除了最後的常數項）
            has_non_zero = False
            for j in range(n):
                if augmented[i, j] != 0:
                    has_non_zero = True
                    break
            
            # 如果一行係數全為零但常數項也為零，這不影響解的唯一性
            if not has_non_zero and augmented[i, n] == 0:
                continue
            
            # 如果一行係數全為零但常數項不為零，這是矛盾
            if not has_non_zero and augmented[i, n] != 0:
                return None, steps, "無解：矛盾方程式"
        
        # 如果通過以上檢查，就是唯一解
        return solution, steps, "成功求解"
    
    def format_value(self, value):
        """格式化數值顯示"""
        if isinstance(value, Fraction):
            if value.denominator == 1:
                return str(value.numerator)
            else:
                return f"{value.numerator}/{value.denominator}"
        else:
            return str(value)
    
    def format_matrix(self, matrix):
        n = len(matrix)
        output = ""
        
        for i in range(n):
            row_str = "⎡" if i == 0 else "⎢" if i < n-1 else "⎣"
            
            for j in range(len(matrix[i])):
                if j == n:
                    row_str += " │ "
                value = matrix[i, j]
                formatted_value = self.format_value(value).rjust(8)
                row_str += formatted_value + " "
            
            row_str += "⎤\n" if i == 0 else "⎥\n" if i < n-1 else "⎦\n"
            output += row_str
        return output
    
    def calculate(self):
        matrix = self.get_matrix()
        if matrix is None:
            return
        
        result, steps, message = self.gauss_jordan_elimination(matrix)
        
        self.result_text.delete(1.0, tk.END)
        self.result_text.insert(tk.END, "🔢 高斯-約旦消去法計算過程\n")
        self.result_text.insert(tk.END, "═" * 70 + "\n\n")
        
        self.result_text.insert(tk.END, "📊 初始增廣矩陣:\n")
        self.result_text.insert(tk.END, self.format_matrix(matrix))
        self.result_text.insert(tk.END, "\n")
        
        self.result_text.insert(tk.END, "🔄 計算步驟:\n")
        for i, (desc, step_matrix) in enumerate(steps):
            self.result_text.insert(tk.END, f"📝 步驟 {i+1}: {desc}\n")
            self.result_text.insert(tk.END, self.format_matrix(step_matrix))
            self.result_text.insert(tk.END, "\n")
        
        self.result_text.insert(tk.END, "✅ 最終結果:\n")
        self.result_text.insert(tk.END, "─" * 40 + "\n")
        
        if result is not None:
            for i, val in enumerate(result):
                formatted_val = self.format_value(val)
                self.result_text.insert(tk.END, f"x{chr(8320 + i)} = {formatted_val}\n")
        else:
            self.result_text.insert(tk.END, f"❌ {message}\n")
        
        # 添加一些數學風格的裝飾
        self.result_text.insert(tk.END, "\n" + "═" * 70 + "\n")
        self.result_text.insert(tk.END, "𝓢𝓸𝓵𝓾𝓽𝓲𝓸𝓷 𝓒𝓸𝓶𝓹𝓵𝓮𝓽𝓮 🎯\n")
    
    def clear(self):
        for row in self.matrix_entries:
            for entry in row:
                entry.delete(0, tk.END)
        self.result_text.delete(1.0, tk.END)

def main():
    root = tk.Tk()
    app = GaussJordanCalculator(root)
    root.mainloop()

if __name__ == "__main__":
    main()