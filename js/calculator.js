// ====== calculator.js ======

    let currentCalcTarget = null; // 當前要填入的輸入欄位ID
    let calcState = {
        display: '0',
        previousValue: null,
        operator: null,
        waitingForOperand: false
    };

    function openCalculator(targetInputId) {
        currentCalcTarget = targetInputId;
        const input = document.getElementById(targetInputId);
        const currentValue = input.value || '0';

        // 初始化計算機狀態
        calcState.display = currentValue === '' ? '0' : currentValue;
        calcState.previousValue = null;
        calcState.operator = null;
        calcState.waitingForOperand = false;

        updateCalcDisplay();
        const calculatorModal = document.getElementById('calculatorModal');
        if(calculatorModal) {
            calculatorModal.style.display = 'flex';
            calculatorModal.style.zIndex = '2012'; // 確保在編輯模態框之上
        }
    }

    function closeCalculator() {
        // 將計算結果填入目標輸入欄位
        if (currentCalcTarget) {
            const input = document.getElementById(currentCalcTarget);
            if (input) {
                let finalValue = calcState.display;

                // 處理錯誤或無效值
                if (finalValue === '錯誤' || finalValue === 'Infinity' || finalValue === 'NaN' || isNaN(parseFloat(finalValue))) {
                    finalValue = input.value || '0'; // 保持原值
                } else {
                    // 格式化數值
                    const numValue = parseFloat(finalValue);
                    if (!isNaN(numValue)) {
                        // 如果是整數，不顯示小數點
                        finalValue = numValue % 1 === 0 ? String(numValue) : String(numValue);
                    }
                }

                input.value = finalValue;
                // 觸發輸入事件，確保其他邏輯能正確運行
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        currentCalcTarget = null;
        document.getElementById('calculatorModal').style.display = 'none';
    }

    function updateCalcDisplay() {
        const display = document.getElementById('calcDisplay');
        if (display) {
            // 格式化顯示
            let formatted = calcState.display;

            // 處理負號和數字
            if (formatted === '-') {
                formatted = '-0';
            }

            // 處理 Infinity 或 NaN
            if (formatted === 'Infinity' || formatted === 'NaN' || isNaN(parseFloat(formatted))) {
                formatted = '錯誤';
                calcState.display = '0';
                calcState.previousValue = null;
                calcState.operator = null;
                calcState.waitingForOperand = true;
            }

            // 限制顯示長度，避免過長
            if (formatted.length > 15 && formatted !== '錯誤') {
                const num = parseFloat(formatted);
                if (!isNaN(num)) {
                    formatted = num.toExponential(8);
                }
            }

            display.textContent = formatted;
        }
    }

    function handleCalcKey(e, value) {
        e.preventDefault();
        e.stopPropagation();
        calcInput(value);
        const btn = e.currentTarget;
        btn.classList.add('pressed');
        const rm = function(){ btn.classList.remove('pressed'); btn.removeEventListener('pointerup',rm); btn.removeEventListener('pointerleave',rm); btn.removeEventListener('pointercancel',rm); };
        btn.addEventListener('pointerup', rm);
        btn.addEventListener('pointerleave', rm);
        btn.addEventListener('pointercancel', rm);
    }
    function calcInput(value) {
        switch(value) {
            case 'C': // Clear All
                calcState.display = '0';
                calcState.previousValue = null;
                calcState.operator = null;
                calcState.waitingForOperand = false;
                break;

            case 'CE': // Clear Entry
                calcState.display = '0';
                break;

            case 'backspace':
                if (calcState.display.length > 1) {
                    calcState.display = calcState.display.slice(0, -1);
                } else {
                    calcState.display = '0';
                }
                break;

            case '±': // Toggle Sign
                if (calcState.display !== '0') {
                    calcState.display = calcState.display.startsWith('-')
                        ? calcState.display.slice(1)
                        : '-' + calcState.display;
                }
                break;

            case '.':
                if (calcState.waitingForOperand) {
                    calcState.display = '0.';
                    calcState.waitingForOperand = false;
                } else if (!calcState.display.includes('.')) {
                    calcState.display += '.';
                }
                break;

            case '=':
                if (calcState.operator && calcState.previousValue !== null) {
                    const result = performCalculation();
                    calcState.display = formatCalcResult(result);
                    calcState.previousValue = null;
                    calcState.operator = null;
                    calcState.waitingForOperand = true;
                }
                break;

            case '+':
            case '-':
            case '*':
            case '/':
                handleOperator(value);
                break;

            default: // Numbers 0-9
                if (calcState.waitingForOperand) {
                    calcState.display = value;
                    calcState.waitingForOperand = false;
                } else {
                    calcState.display = calcState.display === '0' ? value : calcState.display + value;
                }
                break;
        }

        updateCalcDisplay();
    }

    function handleOperator(nextOperator) {
        const inputValue = parseFloat(calcState.display);

        if (calcState.previousValue === null) {
            calcState.previousValue = inputValue;
        } else if (calcState.operator) {
            const result = performCalculation();
            calcState.display = formatCalcResult(result);
            calcState.previousValue = result;
        }

        calcState.waitingForOperand = true;
        calcState.operator = nextOperator;
    }

    function performCalculation() {
        const prev = parseFloat(calcState.previousValue);
        const current = parseFloat(calcState.display);

        if (isNaN(prev) || isNaN(current)) return current;

        let result;
        switch(calcState.operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    return Infinity; // 返回 Infinity，讓顯示層處理
                }
                result = prev / current;
                break;
            default:
                return current;
        }

        // 格式化結果，避免過多小數位
        if (result % 1 === 0) {
            return result;
        } else {
            // 保留最多10位小數，但移除尾部的0
            return parseFloat(result.toFixed(10));
        }
    }

    function formatCalcResult(value) {
        if (value % 1 === 0) {
            return String(value);
        }
        // 移除尾部多餘的0
        return String(parseFloat(value.toFixed(10)));
    }

    // ========== 計算機功能（記帳用，統一使用錢包的計算機）==========
    window.openCalculatorModal = function(targetInputId) {
        if (typeof openCalculator === 'function') {
            openCalculator(targetInputId);
        } else {
            console.error('openCalculator function not found');
        }
    };

    function closeCalculatorModal() {
        if (typeof closeCalculator === 'function') closeCalculator();
    }
    function confirmCalculator() {
        if (typeof closeCalculator === 'function') closeCalculator();
    }
    function calculatorInput(input) {
        if (typeof calcInput === 'function') calcInput(input);
    }
    function updateCalculatorDisplay() {
        if (typeof updateCalcDisplay === 'function') updateCalcDisplay();
    }
