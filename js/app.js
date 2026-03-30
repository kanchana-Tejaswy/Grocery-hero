const emojiMap = {
    'milk': '🥛', 'bread': '🍞', 'egg': '🥚', 'apple': '🍎', 'banana': '🍌',
    'water': '💧', 'coffee': '☕', 'tea': '🍵', 'chicken': '🍗', 'meat': '🥩',
    'fish': '🐟', 'pizza': '🍕', 'cheese': '🧀', 'beer': '🍺', 'wine': '🍷',
    'soda': '🥤', 'fruit': '🍓', 'veg': '🥦', 'onion': '🧅', 'garlic': '🧄',
    'potato': '🥔', 'rice': '🍚', 'pasta': '🍝', 'butter': '🧈', 'salt': '🧂'
};

let items = [];

const addForm = document.getElementById('add-form');
const itemInput = document.getElementById('item-input');
const listContainer = document.getElementById('shopping-list');
const emptyState = document.getElementById('empty-state');
const progressFill = document.getElementById('progress-fill');
const statsText = document.getElementById('stats-text');
const percentText = document.getElementById('percent-text');
const clearBtn = document.getElementById('clear-all');

async function fetchItems() {
    try {
        const res = await fetch('/api/items');
        if (!res.ok) throw new Error('API down');
        items = await res.json();
        render();
    } catch (err) {
        console.log('Using local storage fallback...');
        items = JSON.parse(localStorage.getItem('grocery_hero_items')) || [];
        render();
    }
}

function getEmoji(text) {
    const words = text.toLowerCase().split(' ');
    for (let word of words) {
        if (emojiMap[word]) return emojiMap[word];
        const singular = word.replace(/s$/, '');
        if (emojiMap[singular]) return emojiMap[singular];
    }
    return '🛒';
}

async function addItem(e) {
    e.preventDefault();
    const text = itemInput.value.trim();
    if (!text) return;

    const newItem = {
        id: Date.now().toString(),
        text,
        completed: false,
        emoji: getEmoji(text)
    };

    items.unshift(newItem); // UI optimistic update
    itemInput.value = '';
    render();

    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });
        if (!res.ok) throw new Error();
    } catch (err) {
        // Fallback for offline/no-db
        localStorage.setItem('grocery_hero_items', JSON.stringify(items));
    }
}

async function toggleComplete(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    item.completed = !item.completed;
    render();

    try {
        await fetch('/api/items', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, completed: item.completed })
        });
    } catch (err) {
        localStorage.setItem('grocery_hero_items', JSON.stringify(items));
    }
}

async function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    render();

    try {
        await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
    } catch (err) {
        localStorage.setItem('grocery_hero_items', JSON.stringify(items));
    }
}

function render() {
    listContainer.innerHTML = '';
    
    if (items.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = `item-card flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-50 ${item.completed ? 'bg-slate-50/50' : ''}`;
            
            li.innerHTML = `
                <div class="flex items-center space-x-4 flex-1 cursor-pointer" onclick="toggleComplete('${item.id}')">
                    <div class="relative flex items-center justify-center">
                        <div class="h-6 w-6 rounded-full border-2 border-indigo-200 transition-all ${item.completed ? 'bg-indigo-500 border-indigo-500' : ''}">
                            ${item.completed ? '<svg class="w-4 h-4 text-white mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg>' : ''}
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                             <span class="text-xl">${item.emoji}</span>
                             <span class="font-bold text-slate-700 ${item.completed ? 'line-through opacity-40' : ''}">${item.text}</span>
                        </div>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" class="p-2 text-slate-300 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            `;
            listContainer.appendChild(li);
        });
    }

    const completedCount = items.filter(i => i.completed).length;
    const percentage = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);
    progressFill.style.width = `${percentage}%`;
    percentText.textContent = `${percentage}%`;
    statsText.textContent = items.length === 0 ? "Start your list!" : `${completedCount} of ${items.length} items bagged`;
}

addForm.addEventListener('submit', addItem);
clearBtn.addEventListener('click', () => {
    if (confirm('Clear everything?')) {
        items = [];
        render();
        localStorage.removeItem('grocery_hero_items');
        // Note: Full wipe not implemented in API for safety, but deleting individual items is synced.
    }
});

// Start
fetchItems();
