async function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (!amount) {
        alert('Please enter an amount.');
        return;
    }

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        const rate = data.rates[toCurrency];
        const convertedAmount = (amount * rate).toFixed(2);

        document.getElementById('result').innerText = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
    } catch (error) {
        document.getElementById('result').innerText = 'Error fetching exchange rate data.';
    }
}

let amount = '';
let rateChart = null;

// Currency metadata with symbols and names
const currencyMeta = {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    CNY: { symbol: '¥', name: 'Chinese Yuan' },
    HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    CHF: { symbol: 'Fr', name: 'Swiss Franc' },
    KRW: { symbol: '₩', name: 'South Korean Won' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar' },
    NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
    THB: { symbol: '฿', name: 'Thai Baht' },
    RUB: { symbol: '₽', name: 'Russian Ruble' },
    BRL: { symbol: 'R$', name: 'Brazilian Real' }
};

// Get last 10 days dates
function getLast10Days() {
    const dates = [];
    for (let i = 9; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

// Format date to MM-DD format
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// Fetch historical exchange rates
async function fetchHistoricalRates() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 9);

    document.querySelector('.no-data').style.display = 'block';

    try {
        const response = await fetch(
            `https://api.frankfurter.app/${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}?from=${fromCurrency}&to=${toCurrency}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch historical data');
        }

        const data = await response.json();
        
        const rateData = Object.entries(data.rates).map(([date, rates]) => ({
            date,
            rate: rates[toCurrency]
        }));

        return rateData;
    } catch (error) {
        console.error('Error fetching historical rates:', error);
        const errorDiv = document.querySelector('.no-data');
        errorDiv.innerHTML = `
            <div style="color: var(--system-red);">
                暂时无法获取历史数据
            </div>
        `;
        errorDiv.style.display = 'block';
        return null;
    } finally {
        setTimeout(() => {
            document.querySelector('.no-data').style.display = 'none';
        }, 3000);
    }
}

// Update rate chart
async function updateRateChart() {
    const rateData = await fetchHistoricalRates();
    if (!rateData || rateData.length === 0) {
        const ctx = document.getElementById('rateChart').getContext('2d');
        ctx.font = '14px -apple-system';
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        ctx.textAlign = 'center';
        ctx.fillText('暂无历史数据', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const ctx = document.getElementById('rateChart').getContext('2d');
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (rateChart) {
        rateChart.destroy();
    }

    rateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rateData.map(d => formatDate(d.date)),
            datasets: [{
                label: `${fromCurrency}/${toCurrency}`,
                data: rateData.map(d => d.rate),
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `1 ${fromCurrency} = ${context.parsed.y.toFixed(4)} ${toCurrency}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    const legend = document.querySelector('.chart-legend');
    const latestRate = rateData[rateData.length - 1].rate;
    legend.textContent = `1 ${fromCurrency} = ${latestRate.toFixed(4)} ${toCurrency}`;
}

// Fetch available currencies
async function fetchCurrencies() {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    const currencies = Object.keys(data.rates);
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');

    // Clear existing options
    fromCurrency.innerHTML = '';
    toCurrency.innerHTML = '';

    // Add common currencies first
    Object.keys(currencyMeta).forEach(currency => {
        if (currencies.includes(currency)) {
            const option1 = document.createElement('option');
            option1.value = currency;
            option1.text = `${currency} - ${currencyMeta[currency].name}`;
            fromCurrency.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = currency;
            option2.text = `${currency} - ${currencyMeta[currency].name}`;
            toCurrency.appendChild(option2);
        }
    });

    // Add remaining currencies
    currencies.forEach(currency => {
        if (!currencyMeta[currency]) {
            const option1 = document.createElement('option');
            option1.value = currency;
            option1.text = currency;
            fromCurrency.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = currency;
            option2.text = currency;
            toCurrency.appendChild(option2);
        }
    });

    // Set default values
    document.getElementById('fromCurrency').value = 'USD';
    document.getElementById('toCurrency').value = 'CNY';
    updateCurrencyText();
    updateRateChart(); // Initialize chart
}

// Append number to amount
function appendNumber(num) {
    if (amount.length >= 12) return; // Limit input length
    
    if (num === '.' && amount.includes('.')) return; // Prevent multiple decimal points
    if (num === '.' && amount === '') amount = '0'; // Add leading zero for decimal
    
    amount += num;
    const formattedAmount = formatAmount(amount);
    document.getElementById('fromAmount').innerText = formattedAmount;
    convert(); // Automatically convert when amount changes
}

// Format amount with proper number formatting
function formatAmount(value) {
    if (value === '') return '0';
    
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

// Convert currency
async function convert() {
    if (amount === '') {
        document.getElementById('toAmount').innerText = '0';
        return;
    }

    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        const rate = data.rates[toCurrency];
        const result = parseFloat(amount) * rate;

        // Format the result with proper number formatting
        document.getElementById('toAmount').innerText = formatAmount(result.toFixed(2));
    } catch (error) {
        console.error('Error converting currency:', error);
        document.getElementById('toAmount').innerText = 'Error';
    }
}

// Update currency text and symbols
function updateCurrencyText() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    fetchCurrencySymbol(fromCurrency, 'fromCurrencySymbol');
    fetchCurrencySymbol(toCurrency, 'toCurrencySymbol');
}

// Fetch and update currency symbols
function fetchCurrencySymbol(currency, elementId) {
    const element = document.getElementById(elementId);
    if (currencyMeta[currency]) {
        element.textContent = currencyMeta[currency].symbol;
        document.getElementById(elementId.replace('Symbol', 'Text')).textContent = currencyMeta[currency].name;
    } else {
        element.textContent = currency;
        document.getElementById(elementId.replace('Symbol', 'Text')).textContent = currency;
    }
}

// Switch currencies
function switchCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    updateCurrencyText();
    updateRateChart();
    
    // Also convert the amount with new currency order
    if (amount !== '') {
        convert();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for currency selects
    document.getElementById('fromCurrency').addEventListener('change', () => {
        updateCurrencyText();
        updateRateChart();
    });
    
    document.getElementById('toCurrency').addEventListener('change', () => {
        updateCurrencyText();
        updateRateChart();
    });

    // Add event listener for switch button
    const switchButton = document.getElementById('switch-button');
    if (switchButton) {
        switchButton.addEventListener('click', switchCurrencies);
        // Add hover effect
        switchButton.addEventListener('mouseover', () => {
            switchButton.style.background = '#0051b3';
        });
        switchButton.addEventListener('mouseout', () => {
            switchButton.style.background = 'var(--system-blue)';
        });
    } else {
        console.error('Switch button not found');
    }

    // Add event listeners for keypad
    const keys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    keys.forEach(key => {
        const keyElement = document.getElementById(`key-${key}`);
        if (keyElement) {
            keyElement.addEventListener('click', () => appendNumber(key));
        }
    });

    // Add event listener for decimal point
    const dotKey = document.getElementById('key-dot');
    if (dotKey) {
        dotKey.addEventListener('click', () => appendNumber('.'));
    }

    // Add event listener for convert button
    const convertKey = document.getElementById('key-convert');
    if (convertKey) {
        convertKey.addEventListener('click', convert);
    }

    // Initialize the app
    fetchCurrencies();
});

// Clear amount
function clearAmount() {
    amount = '';
    document.getElementById('fromAmount').innerText = '0';
    document.getElementById('toAmount').innerText = '0';
}